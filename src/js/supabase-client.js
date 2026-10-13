(function () {
  const config = window.KG_SUPABASE_CONFIG || {
    url: '',
    anonKey: '',
    appName: 'kg-multisector-limited'
  };

  const fallbackSeed = {
    applications: [],
    profiles: [],
    forum_posts: []
  };

  const isConfigured = Boolean(
    config.url &&
    config.url.includes('supabase.co') &&
    config.anonKey &&
    !config.anonKey.includes('YOUR_')
  );

  const client = isConfigured && window.supabase
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;

  const storageKey = 'kg_msa_data';
  const mediaBucket = 'community-media';
  const subscriptionFeeUgx = 50000;
  const subscriptionPaymentNumber = '+256 778 617 690';
  const mediaMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'video/mp4',
    'video/webm'
  ]);

  function validateMediaFile(file, { imagesOnly = false, maxBytes = 50 * 1024 * 1024 } = {}) {
    if (!file) return 'Choose a file first.';
    if (!mediaMimeTypes.has(file.type) || (imagesOnly && !file.type.startsWith('image/'))) {
      return imagesOnly
        ? 'Profile photos must be JPG, PNG, WebP, or GIF images.'
        : 'Choose a JPG, PNG, WebP, GIF, PDF, MP4, or WebM file.';
    }
    if (file.size > maxBytes) {
      return `The selected file is too large. Maximum size is ${Math.round(maxBytes / (1024 * 1024))} MB.`;
    }
    return null;
  }

  function safeFileName(file) {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'video/mp4': 'mp4',
      'video/webm': 'webm'
    };
    const extension = extensions[file.type] || '';
    return `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
  }

  function isSelectedFile(file) {
    return typeof File !== 'undefined' && file instanceof File && file.size > 0;
  }

  async function uploadMedia(file, path, options = {}) {
    const validation = validateMediaFile(file, options);
    if (validation) throw new Error(validation);
    const { data, error } = await client.storage.from(mediaBucket).upload(path, file, {
      contentType: file.type,
      upsert: false
    });
    if (error) throw new Error(`File upload failed: ${error.message}`);
    return data.path;
  }

  async function createSignedMediaUrl(path) {
    if (!path) return null;
    const { data, error } = await client.storage.from(mediaBucket).createSignedUrl(path, 3600);
    if (error) throw new Error(`A media attachment could not be opened: ${error.message}`);
    return data.signedUrl;
  }

  async function removeMedia(path) {
    if (!path) return;
    const { error } = await client.storage.from(mediaBucket).remove([path]);
    if (error) throw new Error(`Uploaded file could not be removed: ${error.message}`);
  }

  async function withSignedMedia(records, field) {
    return Promise.all((records || []).map(async (record) => ({
      ...record,
      media_url: await createSignedMediaUrl(record[field])
    })));
  }

  function readLocalCache() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return fallbackSeed;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) return fallbackSeed;

      const cleaned = {
        ...fallbackSeed,
        ...data,
        applications: Array.isArray(data.applications)
          ? data.applications.filter((item) => item && item.id !== 'seed-application-1' && item.email !== 'amina@kgmultisector.com')
          : [],
        profiles: Array.isArray(data.profiles)
          ? data.profiles.filter((item) => item && item.id !== 'profile-amina' && item.email !== 'amina@kgmultisector.com')
          : [],
        forum_posts: Array.isArray(data.forum_posts)
          ? data.forum_posts.filter((item) => item && item.id !== 'seed-forum-1')
          : []
      };
      if (JSON.stringify(cleaned) !== JSON.stringify(data)) writeLocalCache(cleaned);
      return cleaned;
    } catch (error) {
      return fallbackSeed;
    }
  }

  function writeLocalCache(data) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      // ignore storage errors in restricted browsers
    }
  }

  function normalizeApplication(payload) {
    return {
      full_name: payload.fullName || payload.full_name || '',
      email: payload.email || '',
      phone: payload.phone || '',
      location: payload.location || '',
      company: payload.company || '',
      position: payload.position || '',
      industry: payload.industry || '',
      years_in_business: Number(payload.yearsInBusiness || 0),
      website: payload.website || '',
      linkedin: payload.linkedin || '',
      why_join: payload.whyJoin || '',
      contribute: payload.contribute || '',
      gain: payload.gain || '',
      referral: payload.referral || '',
      profile_photo: null
    };
  }

  function normalizeProfile(payload) {
    return {
      id: payload.id || 'profile-current',
      full_name: payload.fullName || payload.full_name || 'Member',
      email: payload.email || '',
      current_role: payload.currentRole || payload.current_role || '',
      company: payload.company || '',
      location: payload.location || '',
      linkedin: payload.linkedin || '',
      bio: payload.bio || '',
      weekly_digest: payload.weeklyDigest ?? true,
      event_reminders: payload.eventReminders ?? true,
      mentions_replies: payload.mentionsReplies ?? true,
      new_forum_activity: payload.newForumActivity ?? false,
      show_profile: payload.showProfile ?? true,
      allow_dm: payload.allowDm ?? true,
      show_network_suggestions: payload.showNetworkSuggestions ?? false,
      role: payload.role || 'member',
      updated_at: new Date().toISOString()
    };
  }

  async function submitApplication(payload) {
    const normalized = normalizeApplication(payload);

    if (!client) {
      return { success: false, message: 'Supabase is not configured. Application was not submitted.' };
    }

    let uploadedPhotoPath = null;
    if (isSelectedFile(payload.profilePhoto)) {
      try {
        uploadedPhotoPath = await uploadMedia(
          payload.profilePhoto,
          `applications/${crypto.randomUUID()}/${safeFileName(payload.profilePhoto)}`,
          { imagesOnly: true, maxBytes: 5 * 1024 * 1024 }
        );
      } catch (error) {
        return { success: false, message: error.message };
      }
      normalized.profile_photo = uploadedPhotoPath;
    }
    const { error } = await client
      .from('applications')
      .insert([normalized])

    if (error) {
      return {
        success: false,
        message: `Application could not be submitted: ${error.message}`
      };
    }

    return {
      success: true,
      source: 'supabase',
      message: `Thank you, ${normalized.full_name}. Your application has been submitted and is under review.`
    };
  }

  async function signIn(payload) {
    const { email, password } = payload || {};
    if (!email || !password) {
      return {
        success: false,
        message: 'Email and password are required.'
      };
    }

    if (!client) {
      return {
        success: false,
        message: 'Supabase is not configured. Sign-in is unavailable until the project URL and anon key are set.'
      };
    }

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      return {
        success: false,
        message: error.message || 'Unable to sign in.'
      };
    }

    const profileResult = await getCurrentProfile();
    if (profileResult.error) {
      await client.auth.signOut();
      return { success: false, message: `Signed in, but member access could not be verified: ${profileResult.error}` };
    }
    if (!profileResult.profile) {
      await client.auth.signOut();
      return { success: false, message: 'This account has no member profile. Contact the community administrator.' };
    }

    return {
      success: true,
      source: 'supabase',
      message: `Welcome back, ${profileResult.profile.full_name}.`,
      data,
      profile: profileResult.profile,
      role: profileResult.profile.role
    };
  }

  async function signUpApprovedApplicant(payload) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) return { success: false, message: `Current sign-in status could not be checked: ${sessionError.message}` };
    if (sessionData.session) {
      return { success: false, message: 'Sign out of the current account before setting up a new member account.' };
    }
    const email = String(payload.email || '').trim().toLowerCase();
    const password = String(payload.password || '');
    if (!email || !password) {
      return { success: false, message: 'Enter your application email and choose a password.' };
    }
    if (password.length < 8) {
      return { success: false, message: 'Use a password with at least 8 characters.' };
    }

    const emailRedirectTo = new URL('login.html', window.location.href).toString();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo }
    });
    if (error) {
      const message = /approved membership application|database error saving new user/i.test(error.message)
        ? 'We could not create the account. Confirm your application is approved, use the same email address, and check whether an account already exists. Contact the administrator if the issue continues.'
        : `Account setup could not be started: ${error.message}`;
      return { success: false, message };
    }
    if (!data.user) {
      return { success: false, message: 'Account setup could not be confirmed. Please try again.' };
    }
    if (!data.session) {
      return {
        success: true,
        message: 'Your account request was accepted. Check your email and confirm your address before signing in. If you have not been told your application was approved, contact the administrator.'
      };
    }

    const profileResult = await getCurrentProfile();
    if (profileResult.error) return { success: false, message: `Account was created, but member profile could not be loaded: ${profileResult.error}` };
    if (!profileResult.profile) return { success: false, message: 'Account was created, but the approved member profile was not found. Contact the administrator.' };
    return {
      success: true,
      message: `Welcome, ${profileResult.profile.full_name}. Your member account is ready.`,
      role: profileResult.profile.role
    };
  }

  async function requestPasswordReset(email) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const normalizedEmail = String(email || '').trim();
    if (!normalizedEmail) return { success: false, message: 'Enter your account email first.' };
    const redirectTo = new URL('login.html?password-recovery=1', window.location.href).toString();
    const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (error) {
      return { success: false, message: `Password reset email could not be sent: ${error.message}` };
    }
    return {
      success: true,
      message: 'If an account exists for that email, a password reset link will arrive shortly.'
    };
  }

  async function updateAccountPassword(password) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const normalizedPassword = String(password || '');
    if (normalizedPassword.length < 8) {
      return { success: false, message: 'Use a password with at least 8 characters.' };
    }
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return { success: false, message: 'Your password reset session is missing or expired. Request a new reset link.' };
    }
    const { error } = await client.auth.updateUser({ password: normalizedPassword });
    if (error) {
      return { success: false, message: `Password could not be updated: ${error.message}` };
    }
    return { success: true, message: 'Password updated. You can now sign in with the new password.' };
  }

  async function syncProfile(payload) {
    if (!client) {
      return {
        success: false,
        message: 'Supabase is not configured. Profile changes were not saved.'
      };
    }

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      return { success: false, message: 'Your session has expired. Sign in again to save profile changes.' };
    }

    const currentProfile = await getCurrentProfile();
    if (currentProfile.error || !currentProfile.profile) {
      return { success: false, message: currentProfile.error || 'Member profile could not be verified.' };
    }
    const normalized = normalizeProfile({ ...payload, id: user.id, email: user.email });
    let profilePhotoPath = currentProfile.profile.profile_photo || null;
    let uploadedPhotoPath = null;
    if (isSelectedFile(payload.profilePhoto)) {
      try {
        uploadedPhotoPath = await uploadMedia(
          payload.profilePhoto,
          `profiles/${user.id}/${safeFileName(payload.profilePhoto)}`,
          { imagesOnly: true, maxBytes: 5 * 1024 * 1024 }
        );
        profilePhotoPath = uploadedPhotoPath;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
    const { data, error } = await client
      .from('profiles')
      .update({
        full_name: normalized.full_name,
        current_role: normalized.current_role,
        company: normalized.company,
        location: normalized.location,
        linkedin: normalized.linkedin,
        bio: normalized.bio,
        profile_photo: profilePhotoPath,
        weekly_digest: normalized.weekly_digest,
        event_reminders: normalized.event_reminders,
        mentions_replies: normalized.mentions_replies,
        new_forum_activity: normalized.new_forum_activity,
        show_profile: normalized.show_profile,
        allow_dm: normalized.allow_dm,
        show_network_suggestions: normalized.show_network_suggestions,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', user.id)
      .select();

    if (error) {
      if (uploadedPhotoPath) await removeMedia(uploadedPhotoPath);
      return {
        success: false,
        message: `Profile changes were not saved: ${error.message}`
      };
    }
    if (uploadedPhotoPath && currentProfile.profile.profile_photo) {
      await removeMedia(currentProfile.profile.profile_photo);
    }

    return {
      success: true,
      source: 'supabase',
      data,
      message: 'Member settings saved successfully.'
    };
  }

  async function createForumPost(payload) {
    if (!client) {
      return { success: false, message: 'Supabase is not configured. Your post was not published.' };
    }
    const profileResult = await getCurrentProfile();
    if (!profileResult.profile) {
      return { success: false, message: profileResult.error || 'Your member profile could not be verified.' };
    }
    let mediaPath = null;
    if (!String(payload.content || '').trim() && !isSelectedFile(payload.mediaFile)) {
      return { success: false, message: 'Write a discussion or attach a file before posting.' };
    }
    if (String(payload.content || '').length > 5000) {
      return { success: false, message: 'Discussion text must be 5,000 characters or fewer.' };
    }
    if (isSelectedFile(payload.mediaFile)) {
      try {
        mediaPath = await uploadMedia(
          payload.mediaFile,
          `forum/${profileResult.profile.auth_user_id}/${safeFileName(payload.mediaFile)}`
        );
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
    const post = {
      user_id: profileResult.profile.auth_user_id,
      author: profileResult.profile.full_name || 'Member',
      topic: payload.topic || 'General',
      content: payload.content || '',
      media_path: mediaPath,
      created_at: new Date().toISOString()
    };

    const { data, error } = await client.from('forum_posts').insert([post]).select();
    if (error) {
      if (mediaPath) await removeMedia(mediaPath);
      return {
        success: false,
        message: `Forum post was not published: ${error.message}`,
        post
      };
    }

    return {
      success: true,
      source: 'supabase',
      data,
      message: 'Your discussion is now live.',
      post: data?.[0] || post
    };
  }

  async function loadForumPosts() {
    if (!client) {
      throw new Error('Supabase is not configured. Forum posts cannot be loaded.');
    }

    const { data, error } = await client
      .from('forum_posts')
      .select('id, user_id, author, topic, content, media_path, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      throw new Error(`Forum posts could not be loaded: ${error.message}`);
    }

    return withSignedMedia(data, 'media_path');
  }

  async function reportForumPost(payload) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return { success: false, message: 'Sign in again before reporting a post.' };
    const reason = String(payload.reason || '').trim();
    const details = String(payload.details || '').trim();
    if (!payload.postId || !reason || reason.length > 120 || details.length > 1000) {
      return { success: false, message: 'Choose a reason up to 120 characters and keep details under 1,000 characters.' };
    }

    const { error } = await client.from('forum_reports').insert([{
      post_id: payload.postId,
      reporter_id: user.id,
      reason,
      details: details || null
    }]);
    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'You already have a pending report for this post.' };
      }
      return { success: false, message: `Post report could not be submitted: ${error.message}` };
    }
    return { success: true, message: 'Thank you. Your report has been sent to the community administrators.' };
  }

  async function loadForumReports() {
    if (!client) throw new Error('Supabase is not configured.');
    await requireAdmin();
    const { data, error } = await client
      .from('forum_reports')
      .select('id, post_id, reporter_id, reason, details, status, created_at, reviewed_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Moderation reports could not be loaded: ${error.message}`);
    const reports = data || [];
    const postIds = [...new Set(reports.map((report) => report.post_id).filter(Boolean))];
    if (!postIds.length) return reports.map((report) => ({ ...report, post: null }));
    const { data: posts, error: postsError } = await client
      .from('forum_posts')
      .select('id, author, topic, content')
      .in('id', postIds);
    if (postsError) throw new Error(`Reported discussions could not be loaded: ${postsError.message}`);
    const postsById = new Map((posts || []).map((post) => [post.id, post]));
    return reports.map((report) => ({
      ...report,
      post: report.post_id ? postsById.get(report.post_id) || null : null
    }));
  }

  async function updateForumReportStatus(reportId, status) {
    const allowedStatuses = ['resolved', 'dismissed'];
    if (!allowedStatuses.includes(status)) {
      return { success: false, message: 'Choose a valid moderation outcome.' };
    }
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    let profile;
    try {
      await requireAdmin();
      const result = await getCurrentProfile();
      profile = result.profile;
      if (!profile) return { success: false, message: 'Administrator profile could not be verified.' };
    } catch (error) {
      return { success: false, message: error.message };
    }

    const { data, error } = await client
      .from('forum_reports')
      .update({
        status,
        reviewed_by: profile.auth_user_id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select('id, status')
      .maybeSingle();
    if (error) return { success: false, message: `Moderation report could not be updated: ${error.message}` };
    if (!data) return { success: false, message: 'Report was not found or could not be updated.' };
    return { success: true, message: `Report marked ${status}.` };
  }

  async function loadApplications() {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile || profileResult.profile.role !== 'admin') {
      throw new Error('Administrator access is required to view applications.');
    }

    const [applicationsResult, countResult] = await Promise.all([
      client
        .from('applications')
        .select('id, full_name, email, phone, location, company, position, industry, years_in_business, website, linkedin, why_join, contribute, gain, referral, profile_photo, auth_user_id, status, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
      client
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
    ]);
    if (applicationsResult.error) throw new Error(`Applications could not be loaded: ${applicationsResult.error.message}`);
    if (countResult.error) throw new Error(`Pending application count could not be loaded: ${countResult.error.message}`);
    const applications = await Promise.all((applicationsResult.data || []).map(async (application) => ({
      ...application,
      profile_photo_url: await createSignedMediaUrl(application.profile_photo)
    })));
    return { applications, pendingCount: countResult.count || 0 };
  }

  async function loadMemberDirectory() {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile) throw new Error('Sign in to view the member directory.');

    const { data, error } = await client
      .from('member_directory')
      .select('id, full_name, current_role, company, location, linkedin, bio, allow_dm, profile_photo')
      .order('full_name', { ascending: true });
    if (error) throw new Error(`Member directory could not be loaded: ${error.message}`);
    return Promise.all((data || []).map(async (member) => ({
      ...member,
      profile_photo_url: await createSignedMediaUrl(member.profile_photo)
    })));
  }

  async function loadDirectMessages() {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile) throw new Error('Sign in to view your messages.');
    const { data, error } = await client
      .from('direct_messages')
      .select('id, sender_profile_id, recipient_profile_id, content, media_path, created_at, read_at')
      .or(`sender_profile_id.eq.${profileResult.profile.id},recipient_profile_id.eq.${profileResult.profile.id}`)
      .order('created_at', { ascending: true });
    if (error) throw new Error(`Messages could not be loaded: ${error.message}`);
    return { messages: await withSignedMedia(data, 'media_path'), profile: profileResult.profile };
  }

  async function sendDirectMessage(recipientProfileId, payload) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const profileResult = await getCurrentProfile();
    if (profileResult.error) return { success: false, message: profileResult.error };
    if (!profileResult.profile) return { success: false, message: 'Sign in again to send a message.' };
    const normalized = String(payload.content || '').trim();
    const mediaFile = isSelectedFile(payload.mediaFile) ? payload.mediaFile : null;
    if (!recipientProfileId || recipientProfileId === profileResult.profile.id) {
      return { success: false, message: 'Choose another member to message.' };
    }
    if ((!normalized && !mediaFile) || normalized.length > 5000) {
      return { success: false, message: 'Enter a message or attach a file. Messages can be up to 5,000 characters.' };
    }
    const messageId = crypto.randomUUID();
    let mediaPath = null;
    if (mediaFile) {
      try {
        mediaPath = await uploadMedia(
          mediaFile,
          `messages/${messageId}/${profileResult.profile.auth_user_id}/${safeFileName(mediaFile)}`
        );
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
    const { data, error } = await client
      .from('direct_messages')
      .insert([{
        id: messageId,
        sender_profile_id: profileResult.profile.id,
        recipient_profile_id: recipientProfileId,
        content: normalized || null,
        media_path: mediaPath
      }])
      .select('id, sender_profile_id, recipient_profile_id, content, media_path, created_at, read_at')
      .single();
    if (error) {
      if (mediaPath) {
        try {
          await removeMedia(mediaPath);
        } catch (cleanupError) {
          return {
            success: false,
            message: `Message could not be sent: ${error.message}. ${cleanupError.message}`
          };
        }
      }
      return {
        success: false,
        message: error.code === '42501'
          ? 'This member is not accepting direct messages.'
          : `Message could not be sent: ${error.message}`
      };
    }
    return { success: true, message: 'Message sent.', data };
  }

  async function markDirectMessagesRead(senderProfileId) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const profileResult = await getCurrentProfile();
    if (profileResult.error) return { success: false, message: profileResult.error };
    if (!profileResult.profile) return { success: false, message: 'Sign in again to update messages.' };
    const { error } = await client
      .from('direct_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_profile_id', profileResult.profile.id)
      .eq('sender_profile_id', senderProfileId)
      .is('read_at', null);
    if (error) return { success: false, message: `Messages could not be marked read: ${error.message}` };
    return { success: true };
  }

  async function loadResources(includeDrafts = false) {
    if (!client) throw new Error('Supabase is not configured.');
    if (includeDrafts) await requireAdmin();
    const { data, error } = await client
      .from('resource_library')
      .select('id, title, category, summary, content, resource_url, media_path, published, created_at, updated_at')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Resources could not be loaded: ${error.message}`);
    return withSignedMedia(data, 'media_path');
  }

  async function saveResource(payload) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    try {
      await requireAdmin();
    } catch (error) {
      return { success: false, message: error.message };
    }
    const profileResult = await getCurrentProfile();
    if (profileResult.error) return { success: false, message: profileResult.error };
    if (!profileResult.profile) return { success: false, message: 'Administrator profile could not be verified.' };
    const title = String(payload.title || '').trim();
    const category = String(payload.category || '').trim();
    const summary = String(payload.summary || '').trim();
    const content = String(payload.content || '').trim();
    const resourceUrl = String(payload.resourceUrl || '').trim();
    const mediaFile = isSelectedFile(payload.mediaFile) ? payload.mediaFile : null;
    if (!title || !category || !summary || (!content && !resourceUrl && !mediaFile)) {
      return { success: false, message: 'Title, category, summary, and resource content, a link, or an attachment are required.' };
    }
    if (title.length > 180 || category.length > 80 || summary.length > 1500 || content.length > 20000) {
      return { success: false, message: 'A resource field is longer than its allowed limit.' };
    }
    if (resourceUrl) {
      let parsedUrl;
      try {
        parsedUrl = new URL(resourceUrl);
      } catch {
        return { success: false, message: 'Enter a valid link beginning with https://.' };
      }
      if (parsedUrl.protocol !== 'https:') {
        return { success: false, message: 'Resource links must use https://.' };
      }
    }
    let existingMediaPath = null;
    if (payload.id) {
      const { data: existing, error: existingError } = await client
        .from('resource_library')
        .select('media_path')
        .eq('id', payload.id)
        .maybeSingle();
      if (existingError) return { success: false, message: `Existing resource could not be checked: ${existingError.message}` };
      if (!existing) return { success: false, message: 'Resource was not found.' };
      existingMediaPath = existing.media_path;
    }
    let mediaPath = existingMediaPath;
    let uploadedMediaPath = null;
    if (mediaFile) {
      try {
        const profileResult = await getCurrentProfile();
        if (profileResult.error || !profileResult.profile) {
          return { success: false, message: profileResult.error || 'Administrator profile could not be verified.' };
        }
        uploadedMediaPath = await uploadMedia(
          mediaFile,
          `resources/${profileResult.profile.auth_user_id}/${safeFileName(mediaFile)}`
        );
        mediaPath = uploadedMediaPath;
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
    const record = {
      title,
      category,
      summary,
      content: content || null,
      resource_url: resourceUrl || null,
      media_path: mediaPath,
      published: payload.published === true || payload.published === 'on'
    };
    const query = payload.id
      ? client.from('resource_library').update({ ...record, updated_at: new Date().toISOString() }).eq('id', payload.id)
      : client.from('resource_library').insert([{
        ...record,
        created_by: profileResult.profile.auth_user_id
      }]);
    const { data, error } = await query.select('id').maybeSingle();
    if (error) {
      if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
      return { success: false, message: `Resource could not be saved: ${error.message}` };
    }
    if (!data) {
      if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
      return { success: false, message: 'Resource was not found or could not be saved.' };
    }
    if (uploadedMediaPath && existingMediaPath) await removeMedia(existingMediaPath);
    return { success: true, message: payload.id ? 'Resource updated.' : 'Resource added.' };
  }

  async function loadNotifications() {
    if (!client) throw new Error('Supabase is not configured.');
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw new Error(`Your session could not be checked: ${userError.message}`);
    if (!user) throw new Error('Sign in to view notifications.');
    const { data, error } = await client
      .from('notifications')
      .select('id, title, body, unread, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Notifications could not be loaded: ${error.message}`);
    return data || [];
  }

  async function markNotificationsRead(notificationIds) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return { success: false, message: 'Sign in again to update notifications.' };
    let query = client.from('notifications').update({ unread: false }).eq('user_id', user.id);
    if (Array.isArray(notificationIds)) {
      if (!notificationIds.length) return { success: true };
      query = query.in('id', notificationIds);
    }
    const { error } = await query;
    if (error) return { success: false, message: `Notifications could not be updated: ${error.message}` };
    return { success: true, message: 'Notifications marked as read.' };
  }

  async function loadConnectionRequests() {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile) throw new Error('Sign in to view your connections.');
    const { data, error } = await client
      .from('connection_requests')
      .select('id, requester_profile_id, recipient_profile_id, status, created_at')
      .or(`requester_profile_id.eq.${profileResult.profile.id},recipient_profile_id.eq.${profileResult.profile.id}`)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Connection requests could not be loaded: ${error.message}`);
    return { requests: data || [], profile: profileResult.profile };
  }

  async function sendConnectionRequest(recipientProfileId) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const profileResult = await getCurrentProfile();
    if (profileResult.error) return { success: false, message: profileResult.error };
    const profile = profileResult.profile;
    if (!profile) return { success: false, message: 'Sign in again to connect with members.' };
    if (!recipientProfileId || recipientProfileId === profile.id) {
      return { success: false, message: 'Choose another member to connect with.' };
    }
    const { data: existing, error: lookupError } = await client
      .from('connection_requests')
      .select('id, requester_profile_id, status')
      .or(`and(requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${recipientProfileId}),and(requester_profile_id.eq.${recipientProfileId},recipient_profile_id.eq.${profile.id})`);
    if (lookupError) return { success: false, message: `Existing connection could not be checked: ${lookupError.message}` };
    const relationship = existing?.find((request) => request.status === 'requested' || request.status === 'accepted');
    if (relationship) {
      return {
        success: false,
        message: relationship.status === 'accepted'
          ? 'You are already connected.'
          : relationship.requester_profile_id === profile.id
            ? 'Your connection request is already pending.'
            : 'This member has already sent you a connection request.'
      };
    }
    const priorOwnRequest = existing?.find((request) => request.requester_profile_id === profile.id);
    const query = priorOwnRequest
      ? client.from('connection_requests').update({ status: 'requested' }).eq('id', priorOwnRequest.id)
      : client.from('connection_requests').insert([{
        requester_profile_id: profile.id,
        recipient_profile_id: recipientProfileId
      }]);
    const { error } = await query;
    if (error) {
      return {
        success: false,
        message: error.code === '42501'
          ? 'This member is not currently available for connection requests.'
          : `Connection request could not be sent: ${error.message}`
      };
    }
    return { success: true, message: 'Connection request sent.' };
  }

  async function updateConnectionRequest(requestId, status) {
    if (!['accepted', 'declined', 'withdrawn'].includes(status)) {
      return { success: false, message: 'Choose a valid connection request action.' };
    }
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const { data, error } = await client
      .from('connection_requests')
      .update({ status })
      .eq('id', requestId)
      .select('id')
      .maybeSingle();
    if (error) return { success: false, message: `Connection request could not be updated: ${error.message}` };
    if (!data) return { success: false, message: 'Connection request was not found or this action is not allowed.' };
    return { success: true, message: `Connection request ${status}.` };
  }

  async function loadAdminMemberExport() {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile || profileResult.profile.role !== 'admin') {
      throw new Error('Administrator access is required to export member data.');
    }

    const { data, error } = await client
      .from('profiles')
      .select('full_name, email, "current_role", company, location, phone, role, show_profile')
      .order('full_name', { ascending: true });
    if (error) throw new Error(`Member report could not be loaded: ${error.message}`);
    return data || [];
  }

  async function loadAdminDashboardStats() {
    if (!client) throw new Error('Supabase is not configured.');
    await requireAdmin();
    const now = new Date();
    const upcomingStart = now.toISOString();
    const monthlyCounts = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
      monthlyCounts.push(
        client.from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'member')
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', monthEnd.toISOString())
      );
    }
    const [membersResult, pendingResult, eventsResult, postsResult, ...monthResults] = await Promise.all([
      client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'member'),
      client.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('date', upcomingStart),
      client.from('forum_posts').select('id', { count: 'exact', head: true }),
      ...monthlyCounts
    ]);
    const resultErrors = [
      ['member total', membersResult.error],
      ['pending applications', pendingResult.error],
      ['upcoming events', eventsResult.error],
      ['forum discussions', postsResult.error],
      ...monthResults.map((result, index) => [`member growth month ${index + 1}`, result.error])
    ].filter(([, error]) => error);
    if (resultErrors.length) {
      throw new Error(`Dashboard analytics could not be loaded (${resultErrors.map(([label, error]) => `${label}: ${error.message}`).join('; ')}).`);
    }
    return {
      memberCount: membersResult.count || 0,
      pendingApplications: pendingResult.count || 0,
      upcomingEvents: eventsResult.count || 0,
      forumDiscussions: postsResult.count || 0,
      monthlyMemberCounts: monthResults.map((result) => result.count || 0)
    };
  }

  async function loadMemberDashboardStats() {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    const profile = profileResult.profile;
    if (!profile) throw new Error('Sign in to view your member dashboard.');
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw new Error(`Your session could not be checked: ${userError.message}`);
    if (!user) throw new Error('Sign in again to view dashboard statistics.');

    const [connectionsResult, unreadResult, eventRsvpsResult, upcomingCountResult, upcomingEventsResult] = await Promise.all([
      client.from('connection_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .or(`requester_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`),
      client.from('direct_messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_profile_id', profile.id)
        .is('read_at', null),
      client.from('event_rsvps')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      client.from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .gte('date', new Date().toISOString()),
      client.from('events')
        .select('id, title, event_type, description, date, venue')
        .eq('status', 'published')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(3)
    ]);
    const errors = [
      ['connections', connectionsResult.error],
      ['unread messages', unreadResult.error],
      ['event RSVPs', eventRsvpsResult.error],
      ['upcoming sessions count', upcomingCountResult.error],
      ['upcoming events', upcomingEventsResult.error]
    ].filter(([, error]) => error);
    if (errors.length) {
      throw new Error(`Member dashboard could not be loaded (${errors.map(([name, error]) => `${name}: ${error.message}`).join('; ')}).`);
    }
    return {
      connectionCount: connectionsResult.count || 0,
      unreadMessages: unreadResult.count || 0,
      eventRsvps: eventRsvpsResult.count || 0,
      upcomingCount: upcomingCountResult.count || 0,
      upcomingEvents: upcomingEventsResult.data || []
    };
  }

  async function requireAdmin() {
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile || profileResult.profile.role !== 'admin') {
      throw new Error('Administrator access is required.');
    }
  }

  async function loadEvents(includeCancelled = false) {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile) throw new Error('Sign in to view events.');

    let query = client.from('events').select('*').order('date', { ascending: true, nullsFirst: false });
    if (!includeCancelled || profileResult.profile.role !== 'admin') {
      query = query.eq('status', 'published');
    }
    const { data, error } = await query;
    if (error) throw new Error(`Events could not be loaded: ${error.message}`);
    const events = data || [];
    if (!events.length) return { events, rsvpedEventIds: [] };

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw new Error(`Your session could not be checked: ${userError.message}`);
    if (!user) throw new Error('Sign in to view your event RSVPs.');
    const { data: rsvps, error: rsvpError } = await client
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', user.id);
    if (rsvpError) throw new Error(`Your event registrations could not be loaded: ${rsvpError.message}`);
    return {
      events: await withSignedMedia(events, 'media_path'),
      rsvpedEventIds: (rsvps || []).map((rsvp) => rsvp.event_id)
    };
  }

  async function saveEvent(payload) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    try {
      await requireAdmin();
    } catch (error) {
      return { success: false, message: error.message };
    }
    const existingResult = payload.id
      ? await client.from('events').select('media_path').eq('id', payload.id).maybeSingle()
      : { data: null, error: null };
    if (existingResult.error) {
      return { success: false, message: `Existing event could not be checked: ${existingResult.error.message}` };
    }
    if (payload.id && !existingResult.data) return { success: false, message: 'Event was not found.' };
    const existingMediaPath = existingResult.data?.media_path || null;
    const mediaFile = isSelectedFile(payload.mediaFile) ? payload.mediaFile : null;
    let uploadedMediaPath = null;
    if (mediaFile) {
      try {
        const profileResult = await getCurrentProfile();
        if (profileResult.error || !profileResult.profile) {
          return { success: false, message: profileResult.error || 'Administrator profile could not be verified.' };
        }
        uploadedMediaPath = await uploadMedia(
          mediaFile,
          `events/${profileResult.profile.auth_user_id}/${safeFileName(mediaFile)}`
        );
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
    const event = {
      title: String(payload.title || '').trim(),
      event_type: String(payload.eventType || '').trim() || 'Community event',
      description: String(payload.description || '').trim(),
      date: payload.date ? new Date(payload.date).toISOString() : null,
      venue: String(payload.venue || '').trim(),
      seats_available: Number(payload.seatsAvailable || 0),
      price: String(payload.price || '').trim(),
      media_path: uploadedMediaPath || existingMediaPath
    };
    if (!event.title || !event.date || !event.venue) {
      if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
      return { success: false, message: 'Event title, date, and venue are required.' };
    }
    if (!Number.isInteger(event.seats_available) || event.seats_available < 0) {
      if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
      return { success: false, message: 'Capacity must be zero (unlimited) or a positive whole number.' };
    }

    if (payload.id && event.seats_available > 0) {
      const { data: currentEvent, error: currentError } = await client
        .from('events')
        .select('rsvp_count')
        .eq('id', payload.id)
        .maybeSingle();
      if (currentError) {
        if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
        return { success: false, message: `Event capacity could not be checked: ${currentError.message}` };
      }
      if (currentEvent && event.seats_available < currentEvent.rsvp_count) {
        if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
        return { success: false, message: `Capacity cannot be lower than the ${currentEvent.rsvp_count} existing RSVPs.` };
      }
    }

    const query = payload.id
      ? client.from('events').update(event).eq('id', payload.id)
      : client.from('events').insert([{ ...event, status: 'published' }]);
    const { data, error } = await query.select('*').maybeSingle();
    if (error) {
      if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
      return { success: false, message: `Event could not be saved: ${error.message}` };
    }
    if (!data) {
      if (uploadedMediaPath) await removeMedia(uploadedMediaPath);
      return { success: false, message: 'Event was not found or could not be saved.' };
    }
    if (uploadedMediaPath && existingMediaPath) await removeMedia(existingMediaPath);
    return { success: true, event: data, message: payload.id ? 'Event updated.' : 'Event created.' };
  }

  async function cancelEvent(eventId) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    try {
      await requireAdmin();
    } catch (error) {
      return { success: false, message: error.message };
    }
    const { data, error } = await client
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId)
      .select('id')
      .maybeSingle();
    if (error) return { success: false, message: `Event could not be cancelled: ${error.message}` };
    if (!data) return { success: false, message: 'Event was not found or could not be cancelled.' };
    return { success: true, message: 'Event cancelled.' };
  }

  async function setEventRsvp(eventId, attending) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return { success: false, message: 'Sign in again to manage your RSVP.' };
    const query = attending
      ? client.from('event_rsvps').insert([{ event_id: eventId, user_id: user.id }])
      : client.from('event_rsvps').delete().eq('event_id', eventId).eq('user_id', user.id);
    const { error } = await query;
    if (error) return { success: false, message: `RSVP could not be ${attending ? 'saved' : 'cancelled'}: ${error.message}` };
    return { success: true, message: attending ? 'You are registered for this event.' : 'Your RSVP has been cancelled.' };
  }

  async function updateApplicationStatus(applicationId, status) {
    const allowedStatuses = ['pending', 'review', 'approved', 'rejected'];
    if (!allowedStatuses.includes(status)) {
      return { success: false, message: 'Choose a valid application status.' };
    }
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const profileResult = await getCurrentProfile();
    if (profileResult.error) return { success: false, message: profileResult.error };
    if (!profileResult.profile || profileResult.profile.role !== 'admin') {
      return { success: false, message: 'Administrator access is required to update applications.' };
    }

    const { data, error } = await client
      .from('applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select('id, status')
      .maybeSingle();
    if (error) return { success: false, message: `Application status was not updated: ${error.message}` };
    if (!data) return { success: false, message: 'Application was not found or you do not have permission to update it.' };
    return {
      success: true,
      data,
      message: status === 'approved'
        ? 'Application approved. Please notify the applicant to set up an account from the login page using this application email.'
        : 'Application status updated.'
    };
  }

  async function sendApprovedApplicantInvitation(applicationId) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    try {
      const profile = await requireAdmin();
      if (!profile) return { success: false, message: 'Administrator access is required to invite applicants.' };
      const { data, error } = await client.functions.invoke('send-member-invitation', {
        body: { applicationId }
      });
      if (error) {
        const detail = error.context?.json?.error || error.message;
        return { success: false, message: `Invitation email could not be sent: ${detail}` };
      }
      return {
        success: true,
        message: data?.message || 'Account invitation email sent.'
      };
    } catch (error) {
      return { success: false, message: `Invitation email could not be sent: ${error.message}` };
    }
  }

  async function loadSubscriptionPayments() {
    if (!client) throw new Error('Supabase is not configured.');
    const profileResult = await getCurrentProfile();
    if (profileResult.error) throw new Error(profileResult.error);
    if (!profileResult.profile) throw new Error('Sign in to view subscription status.');
    const { data, error } = await client
      .from('subscription_payments')
      .select('id, amount_ugx, billing_period, payment_method, payer_phone, transaction_reference, status, reviewed_at, expires_at, created_at')
      .eq('profile_id', profileResult.profile.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Subscription payments could not be loaded: ${error.message}`);
    return { payments: data || [], profile: profileResult.profile };
  }

  async function submitSubscriptionPayment(payload) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const profileResult = await getCurrentProfile();
    if (profileResult.error) return { success: false, message: profileResult.error };
    if (!profileResult.profile) return { success: false, message: 'Sign in before submitting payment details.' };
    const phone = String(payload.phone || '').trim();
    const reference = String(payload.reference || '').trim();
    if (phone.length < 7 || phone.length > 30 || reference.length < 4 || reference.length > 120) {
      return { success: false, message: 'Enter the phone number used and a transaction reference (4–120 characters).' };
    }
    const { error } = await client.from('subscription_payments').insert([{
      profile_id: profileResult.profile.id,
      amount_ugx: subscriptionFeeUgx,
      billing_period: 'annual',
      payment_method: 'MTN Mobile Money',
      payer_phone: phone,
      transaction_reference: reference
    }]);
    if (error) {
      if (error.code === '23505') {
        return { success: false, message: 'That transaction reference has already been submitted.' };
      }
      return { success: false, message: `Payment details could not be submitted: ${error.message}` };
    }
    return { success: true, message: 'Payment details submitted. Your subscription will activate after an administrator verifies the transaction.' };
  }

  async function loadSubscriptionPaymentReviews() {
    if (!client) throw new Error('Supabase is not configured.');
    await requireAdmin();
    const { data, error } = await client
      .from('subscription_payments')
      .select('id, amount_ugx, billing_period, payment_method, payer_phone, transaction_reference, status, created_at, profile:profiles!subscription_payments_profile_id_fkey(full_name, email, company)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new Error(`Subscription payments could not be loaded for review: ${error.message}`);
    return data || [];
  }

  async function reviewSubscriptionPayment(paymentId, status) {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    if (!['verified', 'rejected'].includes(status)) {
      return { success: false, message: 'Choose verified or rejected.' };
    }
    let user;
    try {
      await requireAdmin();
      const result = await client.auth.getUser();
      if (result.error || !result.data.user) {
        return { success: false, message: result.error?.message || 'Sign in again to review payments.' };
      }
      user = result.data.user;
    } catch (error) {
      return { success: false, message: error.message };
    }
    const { data, error } = await client
      .from('subscription_payments')
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .eq('status', 'pending')
      .select('id, status, expires_at')
      .maybeSingle();
    if (error) return { success: false, message: `Payment review could not be saved: ${error.message}` };
    if (!data) return { success: false, message: 'Pending payment was not found or was already reviewed.' };
    return {
      success: true,
      message: status === 'verified'
        ? 'Payment verified. The annual subscription is active for one year.'
        : 'Payment marked as rejected.'
    };
  }

  async function getCurrentProfile() {
    if (!client) return { profile: null, error: 'Supabase is not configured.' };
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) return { profile: null, error: userError.message };
    if (!user) return { profile: null, error: null };
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();
    if (error) return { profile: null, error: error.message };
    if (!data) return { profile: null, error: null };
    try {
      return {
        profile: {
          ...data,
          profile_photo_url: await createSignedMediaUrl(data.profile_photo)
        },
        error: null
      };
    } catch (mediaError) {
      return { profile: null, error: mediaError.message };
    }
  }

  async function signOut() {
    if (!client) return { success: false, message: 'Supabase is not configured.' };
    const { error } = await client.auth.signOut();
    return error
      ? { success: false, message: error.message }
      : { success: true };
  }

  window.KGData = {
    config,
    isConfigured,
    client,
    submitApplication,
    signIn,
    signUpApprovedApplicant,
    requestPasswordReset,
    updateAccountPassword,
    getCurrentProfile,
    signOut,
    syncProfile,
    createForumPost,
    loadForumPosts,
    reportForumPost,
    loadForumReports,
    updateForumReportStatus,
    loadApplications,
    loadMemberDirectory,
    loadDirectMessages,
    sendDirectMessage,
    markDirectMessagesRead,
    loadResources,
    saveResource,
    loadNotifications,
    markNotificationsRead,
    loadConnectionRequests,
    sendConnectionRequest,
    updateConnectionRequest,
    loadAdminMemberExport,
    loadAdminDashboardStats,
    loadMemberDashboardStats,
    loadEvents,
    saveEvent,
    cancelEvent,
    setEventRsvp,
    updateApplicationStatus,
    sendApprovedApplicantInvitation,
    loadSubscriptionPayments,
    submitSubscriptionPayment,
    loadSubscriptionPaymentReviews,
    reviewSubscriptionPayment,
    subscriptionFeeUgx,
    subscriptionPaymentNumber,
    readLocalCache,
    writeLocalCache
  };
})();
