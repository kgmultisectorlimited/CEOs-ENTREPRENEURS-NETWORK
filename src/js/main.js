document.addEventListener('DOMContentLoaded', function () {
  let menuToggle = document.querySelector('.menu-toggle');
  const header = document.querySelector('.site-header');
  const headerNavigation = header?.querySelector('.main-nav');
  if (!menuToggle && headerNavigation) {
    menuToggle = document.createElement('button');
    menuToggle.type = 'button';
    menuToggle.className = 'menu-toggle';
    menuToggle.setAttribute('aria-label', 'Toggle navigation');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.innerHTML = '<span></span><span></span><span></span>';
    headerNavigation.before(menuToggle);
  }

  const appRole = document.body.dataset.authRole;
  let mobileNavigation = null;
  let memberNavigationSubscription = null;
  let navigationCountRefresh = null;
  if (appRole === 'member' || appRole === 'admin') {
    const memberItems = [
      { label: 'Home', href: 'member-dashboard.html', path: 'member-dashboard.html', icon: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6' },
      { label: 'Network', href: 'member-network.html', path: 'member-network.html', icon: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6' },
      { label: 'Messages', href: 'messages.html', path: 'messages.html', icon: 'M21 11.5a8.5 8.5 0 0 1-12.7 7.4L3 21l2.1-5.3A8.5 8.5 0 1 1 21 11.5Z' },
      { label: 'Events', href: 'events.html', path: 'events.html', icon: 'M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1ZM8 13h3M8 17h3' },
      { label: 'Profile', href: 'member-profile.html', path: 'member-profile.html', icon: 'M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z' }
    ];
    const adminItems = [
      { label: 'Home', href: 'admin-dashboard.html', path: 'admin-dashboard.html', icon: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6' },
      { label: 'Members', href: 'members-directory.html', path: 'members-directory.html', icon: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6' },
      { label: 'Review', href: 'admin-moderation.html', path: 'admin-moderation.html', icon: 'M9 11l2 2 4-4M5 4h14v17H5zM9 4V2h6v2' },
      { label: 'Events', href: 'events.html', path: 'events.html', icon: 'M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1ZM8 13h3M8 17h3' },
      { label: 'Settings', href: 'member-settings.html', path: 'member-settings.html', icon: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.7 2.9-.2-.1a1.7 1.7 0 0 0-1.8.2l-.1.1h-3.4l-.1-.2a1.7 1.7 0 0 0-1.5-1l-.2.1-2.9-1.7.1-.2a1.7 1.7 0 0 0-.2-1.8l-.1-.1v-3.4l.2-.1a1.7 1.7 0 0 0 1-1.5l-.1-.2 1.7-2.9.2.1a1.7 1.7 0 0 0 1.8-.2l.1-.1h3.4l.1.2a1.7 1.7 0 0 0 1.5 1l.2-.1 2.9 1.7-.1.2a1.7 1.7 0 0 0 .2 1.8l.1.1V15Z' }
    ];
    mobileNavigation = document.createElement('nav');
    mobileNavigation.className = 'app-mobile-nav';
    mobileNavigation.setAttribute('aria-label', 'App navigation');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    (appRole === 'admin' ? adminItems : memberItems).forEach((item) => {
      const link = document.createElement('a');
      link.href = item.href;
      link.className = 'app-mobile-nav-link';
      link.dataset.navLabel = item.label;
      link.setAttribute('aria-label', item.label);
      if (currentPath === item.path) link.setAttribute('aria-current', 'page');
      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      icon.setAttribute('viewBox', '0 0 24 24');
      icon.setAttribute('fill', 'none');
      icon.setAttribute('stroke', 'currentColor');
      icon.setAttribute('stroke-width', '1.8');
      icon.setAttribute('stroke-linecap', 'round');
      icon.setAttribute('stroke-linejoin', 'round');
      icon.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', item.icon);
      icon.append(path);
      const label = document.createElement('span');
      label.textContent = item.label;
      link.append(icon, label);
      const badgeKey = { Network: 'network', Messages: 'messages', Events: 'events' }[item.label];
      if (badgeKey) {
        const badge = document.createElement('span');
        badge.className = 'app-mobile-nav-badge';
        badge.dataset.navBadge = badgeKey;
        badge.hidden = true;
        badge.setAttribute('aria-hidden', 'true');
        link.append(badge);
      }
      mobileNavigation.append(link);
    });
    document.body.classList.add('app-mobile-shell');
    document.body.append(mobileNavigation);
  }

  let installPromptEvent = null;
  const isStandaloneApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .catch((error) => console.error('KG CEC Network app setup failed:', error));
  }
  if (!isStandaloneApp) {
    const installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = 'btn btn-primary pwa-install-button';
    installButton.textContent = 'Install app';
    installButton.setAttribute('aria-label', 'Install KG CEOs and Entrepreneurs Network');
    const installButtonHost = document.querySelector('.site-header .nav-wrap') || document.body;
    if (installButtonHost.matches('.site-header .nav-wrap')) {
      installButtonHost.classList.add('has-install-button');
    }
    installButtonHost.append(installButton);
    const installHelp = document.createElement('dialog');
    installHelp.className = 'app-install-help';
    installHelp.setAttribute('aria-labelledby', 'appInstallHelpTitle');
    const installTitle = document.createElement('h2');
    installTitle.id = 'appInstallHelpTitle';
    const installDescription = document.createElement('p');
    const installSteps = document.createElement('ol');
    const installClose = document.createElement('button');
    installClose.type = 'button';
    installClose.className = 'btn btn-primary small-btn';
    installClose.textContent = 'Got it';
    installClose.addEventListener('click', () => installHelp.close());
    installHelp.append(installTitle, installDescription, installSteps, installClose);
    document.body.append(installHelp);
    const showInstallHelp = () => {
      const userAgent = window.navigator.userAgent;
      const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent) ||
        (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
      const isAndroid = /Android/i.test(userAgent);
      const steps = isAppleMobile
        ? [
            'Open this page in Safari (not an in-app browser).',
            'Tap Share, then choose Add to Home Screen.',
            'Leave the app name as KG CEC NETWORK and tap Add.'
          ]
        : isAndroid
          ? [
              'Open this page in Chrome.',
              'Tap the ⋮ menu, then choose Install app or Add to Home screen.',
              'Confirm the prompt to add KG CEC NETWORK to your phone.'
            ]
          : [
              'Open this website in your browser menu.',
              'Choose Install app or Add to Home screen and confirm.'
            ];
      installTitle.textContent = isAppleMobile ? 'Add KG CEC NETWORK to your Home Screen' : 'Install KG CEC NETWORK';
      installDescription.textContent = isAppleMobile
        ? 'Follow these steps to add the app to your iPhone or iPad.'
        : 'Follow these steps to install the app on your device.';
      installSteps.replaceChildren(...steps.map((step) => {
        const item = document.createElement('li');
        item.textContent = step;
        return item;
      }));
      if (typeof installHelp.showModal === 'function') installHelp.showModal();
      else window.alert(`${installTitle.textContent}\n${steps.join('\n')}`);
    };
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installPromptEvent = event;
    });
    window.addEventListener('appinstalled', () => {
      installPromptEvent = null;
      installButton.remove();
    });
    installButton.addEventListener('click', async () => {
      if (!installPromptEvent) {
        showInstallHelp();
        return;
      }
      try {
        await installPromptEvent.prompt();
        const choice = await installPromptEvent.userChoice;
        if (choice.outcome === 'accepted') installButton.remove();
        installPromptEvent = null;
      } catch (error) {
        console.error('KG CEC Network app installation failed:', error);
        installPromptEvent = null;
        showInstallHelp();
      }
    });
  }
  const yearNode = document.getElementById('year');
  const form = document.getElementById('membershipForm');
  const formStatus = document.getElementById('formStatus');
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  const passwordRecoveryForm = document.getElementById('passwordRecoveryForm');
  const passwordRecoveryStatus = document.getElementById('passwordRecoveryStatus');
  const settingsForm = document.getElementById('settingsForm');
  const settingsStatus = document.getElementById('settingsStatus');
  const forumForm = document.getElementById('forumComposeForm');
  const forumStatus = document.getElementById('forumStatus');
  const forumFeed = document.querySelector('.forum-feed');
  const forumPostList = document.getElementById('forumPostList');
  const forumFeedStatus = document.getElementById('forumFeedStatus');
  const forumActivitySummary = document.getElementById('forumActivitySummary');
  const forumTrendingList = document.getElementById('forumTrendingList');
  const moderationQueue = document.getElementById('moderationQueue');
  const moderationQueueStatus = document.getElementById('moderationQueueStatus');
  const moderationQueueSummary = document.getElementById('moderationQueueSummary');
  const moderationPendingCount = document.getElementById('moderationPendingCount');
  const moderationTotalCount = document.getElementById('moderationTotalCount');
  const moderationResolvedCount = document.getElementById('moderationResolvedCount');
  const chatList = document.getElementById('chatList');
  const chatThread = document.getElementById('chatThread');
  const chatPanelHeader = document.querySelector('.chat-panel-header');
  if (chatPanelHeader) {
    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'chat-back-button';
    backButton.setAttribute('aria-label', 'Back to conversations');
    backButton.textContent = '‹';
    backButton.addEventListener('click', () => {
      activeMessagePartnerId = null;
      renderMessages();
    });
    chatPanelHeader.prepend(backButton);
  }
  const messageComposer = document.getElementById('messageComposer');
  const messageStatus = document.getElementById('messageStatus');
  const messageListStatus = document.getElementById('messageListStatus');
  const callInboxStatus = document.getElementById('directCallStatus');
  const callPanel = document.getElementById('directCallPanel');
  const remoteCallVideo = document.getElementById('remoteCallVideo');
  const remoteCallAudio = document.getElementById('remoteCallAudio');
  const localCallVideo = document.getElementById('localCallVideo');
  const newMessageControls = document.getElementById('newMessageControls');
  const newMessageRecipient = document.getElementById('newMessageRecipient');
  const resourceGrid = document.getElementById('resourceGrid');
  const resourceStatus = document.getElementById('resourceStatus');
  const resourceAdminForm = document.getElementById('resourceAdminForm');
  const resourceAdminStatus = document.getElementById('resourceAdminStatus');
  const resourceFormHeading = document.getElementById('resourceFormHeading');
  const resourceFormSubmit = document.getElementById('resourceFormSubmit');
  const resourceDialog = document.getElementById('resourceDialog');
  const notificationList = document.getElementById('notificationList');
  const notificationStatus = document.getElementById('notificationStatus');
  let directMessages = [];
  let messageProfile = null;
  let messageDirectory = [];
  let activeMessagePartnerId = null;
  let callInboxChannel = null;
  let callInboxPending = false;
  let activeCall = null;
  let incomingCall = null;
  const seenCallInviteIds = new Set();
  let voiceRecorder = null;
  let voiceRecordingStream = null;
  let voiceRecordingParts = [];
  let recordedVoiceFile = null;
  let resourceItems = [];
  let activeResourceCategory = 'all';
  let notificationItems = [];
  let activeNotificationFilter = 'all';
  let selectedNotificationId = null;
  let activeConversationTopic = 'all';
  let networkMembers = [];
  let networkRequests = [];
  let networkProfile = null;
  let directoryRequests = [];
  let directoryProfile = null;
  let refreshMemberDirectory = null;
  let activeNetworkFilter = 'all';
  const adminApplicationList = document.getElementById('adminApplicationList');
  const pendingApplicationCount = document.getElementById('pendingApplicationCount');
  const applicationReviewStatus = document.getElementById('applicationReviewStatus');
  const approvedApplicantSelect = document.getElementById('approvedApplicantSelect');
  const generateApplicantCodeButton = document.getElementById('generateApplicantCodeButton');
  const applicantSetupCodeResult = document.getElementById('applicantSetupCodeResult');
  const memberDirectoryGrid = document.getElementById('memberDirectoryGrid');
  const memberSearch = document.getElementById('memberSearch');
  const directoryStatus = document.getElementById('directoryStatus');
  const adminActionStatus = document.getElementById('adminActionStatus');
  const eventListing = document.getElementById('eventListing');
  const eventPageStatus = document.getElementById('eventPageStatus');
  const eventAdminForm = document.getElementById('eventAdminForm');
  const eventAdminStatus = document.getElementById('eventAdminStatus');
  const eventFormHeading = document.getElementById('eventFormHeading');
  const eventFormSubmit = document.getElementById('eventFormSubmit');
  const nextEventSummary = document.getElementById('nextEventSummary');
  const upcomingEventHighlights = document.getElementById('upcomingEventHighlights');
  const conversationGrid = document.getElementById('conversationGrid');
  const conversationStatus = document.getElementById('conversationStatus');
  const networkGrid = document.getElementById('networkGrid');
  const networkStatus = document.getElementById('networkStatus');
  const networkFeaturedMembers = document.getElementById('networkFeaturedMembers');
  const memberUpcomingEvents = document.getElementById('memberUpcomingEvents');
  const memberRecentNotifications = document.getElementById('memberRecentNotifications');
  const memberDashboardStatus = document.getElementById('memberDashboardStatus');
  let forumPosts = [];
  let activeForumTopic = 'all';
  let forumReports = [];
  let activeReportFilter = 'all';

  const setStatus = (element, message, type = 'info') => {
    if (!element) return;
    element.className = 'form-status';
    if (type === 'success') element.classList.add('success');
    if (type === 'error') element.classList.add('error');
    element.textContent = message;
  };

  function enhanceSiteFooters() {
    const policyTargets = new Map([
      ['Community Guidelines', 'community-guidelines.html'],
      ['Privacy Policy', 'privacy-policy.html'],
      ['Terms', 'terms.html']
    ]);
    document.querySelectorAll('.site-footer').forEach((footer) => {
      footer.querySelectorAll('.footer-links a').forEach((link) => {
        const target = policyTargets.get(link.textContent.trim());
        if (target) link.href = target;
        if (link.textContent.trim() === 'Contact' && link.getAttribute('href') === '#') {
          link.href = 'mailto:kgmultisectorlimited@gmail.com';
        }
      });
      if (footer.querySelector('[data-contact-footer]')) return;
      const hasContactHeading = [...footer.querySelectorAll('.footer-links h3')]
        .some((heading) => heading.textContent.trim() === 'Contact');
      if (hasContactHeading) return;
      const contact = document.createElement('div');
      contact.className = 'footer-links';
      contact.dataset.contactFooter = '';
      const heading = document.createElement('h3');
      heading.textContent = 'Contact';
      const phone = document.createElement('a');
      phone.href = 'tel:+256778617690';
      phone.textContent = '+256 778 617 690';
      const email = document.createElement('a');
      email.href = 'mailto:kgmultisectorlimited@gmail.com';
      email.textContent = 'kgmultisectorlimited@gmail.com';
      contact.append(heading, phone, email);
      footer.querySelector('.footer-grid')?.append(contact);
    });
  }

  enhanceSiteFooters();

  document.querySelectorAll('[data-subscription-fee]').forEach((element) => {
    element.textContent = `UGX ${Number(window.KGData?.subscriptionFeeUgx || 50000).toLocaleString()}`;
  });
  document.querySelectorAll('[data-subscription-number]').forEach((element) => {
    element.textContent = window.KGData?.subscriptionPaymentNumber || '+256 778 617 690';
  });

  const readForm = (candidate) => Object.fromEntries(new FormData(candidate).entries());

  async function exportAdminMembers() {
    if (!window.KGData || typeof window.KGData.loadAdminMemberExport !== 'function') {
      setStatus(adminActionStatus, 'Member export is unavailable until Supabase is configured.', 'error');
      return;
    }
    try {
      setStatus(adminActionStatus, 'Preparing member export…');
      const members = await window.KGData.loadAdminMemberExport();
      if (!members.length) {
        setStatus(adminActionStatus, 'There are no member profiles to export.');
        return;
      }
      const columns = [
        ['full_name', 'Full name'],
        ['email', 'Email'],
        ['current_role', 'Role title'],
        ['company', 'Company'],
        ['location', 'Location'],
        ['phone', 'Phone'],
        ['role', 'Account role'],
        ['show_profile', 'Directory visible']
      ];
      const csvCell = (value) => {
        let text = value === null || value === undefined ? '' : String(value);
        if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
        return `"${text.replace(/"/g, '""')}"`;
      };
      const csv = [
        columns.map(([, label]) => csvCell(label)).join(','),
        ...members.map((member) => columns.map(([key]) => csvCell(member[key])).join(','))
      ].join('\r\n');
      const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `kg-multisector-members-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus(adminActionStatus, `${members.length} member profile${members.length === 1 ? '' : 's'} exported.`, 'success');
    } catch (error) {
      setStatus(adminActionStatus, error.message, 'error');
    }
  }

  function renderMemberNetwork() {
    if (!networkGrid || !networkProfile) return;
    const visibleMembers = networkMembers.filter((member) => {
      if (member.id === networkProfile.id) return false;
      const role = (member.current_role || '').toLowerCase();
      if (activeNetworkFilter === 'founders') return /(founder|owner|co-founder|entrepreneur)/.test(role);
      if (activeNetworkFilter === 'operators') return /(operator|operations|coo|chief operating|managing director)/.test(role);
      if (activeNetworkFilter === 'investors') return /(investor|investment|venture|capital)/.test(role);
      if (activeNetworkFilter === 'advisors') return /(advisor|adviser|board|consultant)/.test(role);
      return true;
    });
    networkGrid.replaceChildren();
    if (!visibleMembers.length) {
      const empty = document.createElement('p');
      empty.className = 'form-status';
      empty.textContent = networkMembers.some((member) => member.id !== networkProfile.id)
        ? 'No visible members match this filter.'
        : 'No other members are available yet.';
      networkGrid.append(empty);
    }
    visibleMembers.forEach((member, index) => {
      const card = document.createElement('article');
      card.className = 'network-card';
      const top = document.createElement('div');
      top.className = 'network-top';
      const avatar = document.createElement('div');
      avatar.className = `member-avatar ${['', 'alt', 'warm', 'dark', 'rose', 'blue'][index % 6]}`.trim();
      setMemberAvatar(avatar, member.profile_photo_url, member.full_name);
      const badge = document.createElement('span');
      badge.className = 'verified-tag';
      badge.textContent = 'Member';
      top.append(avatar, badge);
      const body = document.createElement('div');
      body.className = 'network-body';
      const name = document.createElement('h3');
      name.textContent = member.full_name || 'Member';
      const role = document.createElement('p');
      role.className = 'member-role';
      role.textContent = member.current_role || 'Community member';
      const company = document.createElement('p');
      company.className = 'member-company';
      company.textContent = member.company || '';
      const location = document.createElement('p');
      location.className = 'member-company';
      location.textContent = member.location || '';
      const footer = document.createElement('div');
      footer.className = 'network-footer';
      const relationship = networkRequests.find((request) =>
        (request.requester_profile_id === member.id && request.recipient_profile_id === networkProfile.id) ||
        (request.recipient_profile_id === member.id && request.requester_profile_id === networkProfile.id)
      );
      if (relationship?.status === 'accepted') {
        const connected = document.createElement('span');
        connected.textContent = 'Connected';
        footer.append(connected);
      } else if (relationship?.status === 'requested' && relationship.recipient_profile_id === networkProfile.id) {
        const received = document.createElement('span');
        received.textContent = 'Request received';
        const accept = document.createElement('button');
        accept.type = 'button';
        accept.className = 'btn btn-primary small-btn';
        accept.textContent = 'Accept';
        accept.addEventListener('click', () => updateNetworkRequest(relationship.id, 'accepted'));
        const decline = document.createElement('button');
        decline.type = 'button';
        decline.className = 'btn btn-secondary small-btn';
        decline.textContent = 'Decline';
        decline.addEventListener('click', () => updateNetworkRequest(relationship.id, 'declined'));
        footer.append(received, accept, decline);
      } else if (relationship?.status === 'requested') {
        const sent = document.createElement('span');
        sent.textContent = 'Request sent';
        const withdraw = document.createElement('button');
        withdraw.type = 'button';
        withdraw.className = 'btn btn-secondary small-btn';
        withdraw.textContent = 'Withdraw';
        withdraw.addEventListener('click', () => updateNetworkRequest(relationship.id, 'withdrawn'));
        footer.append(sent, withdraw);
      } else {
        const connect = document.createElement('button');
        connect.type = 'button';
        connect.className = 'btn btn-secondary small-btn';
        connect.textContent = 'Connect';
        connect.addEventListener('click', async () => {
          connect.disabled = true;
          try {
            const result = await window.KGData.sendConnectionRequest(member.id);
            if (!result.success) throw new Error(result.message);
            await loadMemberNetwork();
            setStatus(networkStatus, result.message, 'success');
          } catch (error) {
            setStatus(networkStatus, error.message, 'error');
            connect.disabled = false;
          }
        });
        footer.append(connect);
      }
      if (member.allow_dm) {
        const message = document.createElement('a');
        message.className = 'btn btn-primary small-btn';
        message.href = `messages.html?to=${encodeURIComponent(member.id)}`;
        message.textContent = 'Message';
        footer.append(message);
      }
      body.append(name, role, company, location, footer);
      card.append(top, body);
      networkGrid.append(card);
    });
    document.getElementById('networkCount').textContent = `${visibleMembers.length} visible member${visibleMembers.length === 1 ? '' : 's'}`;

    if (networkFeaturedMembers) {
      networkFeaturedMembers.replaceChildren();
      if (!visibleMembers.length) {
        const empty = document.createElement('li');
        empty.textContent = 'No other members are available yet.';
        networkFeaturedMembers.append(empty);
      }
      visibleMembers.slice(0, 3).forEach((member) => {
        const item = document.createElement('li');
        const name = document.createElement('strong');
        name.textContent = member.full_name || 'Member';
        const detail = document.createElement('span');
        detail.textContent = [member.current_role, member.company].filter(Boolean).join(' · ') || 'Community member';
        item.append(name, detail);
        networkFeaturedMembers.append(item);
      });
    }
  }

  async function loadMemberNetwork() {
    if (!networkGrid || !window.KGData) return;
    setStatus(networkStatus, 'Loading member network…');
    try {
      const [members, relationshipData] = await Promise.all([
        window.KGData.loadMemberDirectory(),
        window.KGData.loadConnectionRequests()
      ]);
      networkMembers = members;
      networkRequests = relationshipData.requests;
      networkProfile = relationshipData.profile;
      renderMemberNetwork();
      setStatus(networkStatus, 'Member network is up to date.');
    } catch (error) {
      networkGrid.replaceChildren();
      setStatus(networkStatus, error.message, 'error');
    }
  }

  async function updateNetworkRequest(requestId, status) {
    try {
      const result = await window.KGData.updateConnectionRequest(requestId, status);
      if (!result.success) throw new Error(result.message);
      await loadMemberNetwork();
      setStatus(networkStatus, result.message, 'success');
    } catch (error) {
      setStatus(networkStatus, error.message, 'error');
    }
  }

  function renderConversationListings(events, rsvpedEventIds) {
    if (!conversationGrid) return;
    const upcoming = events.filter((event) => event.status === 'published');
    const visible = upcoming.filter((event) =>
      activeConversationTopic === 'all' ||
      (event.event_type || '').toLowerCase().includes(activeConversationTopic.toLowerCase())
    );
    conversationGrid.replaceChildren();
    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'form-status';
      empty.textContent = activeConversationTopic === 'all'
        ? 'No upcoming community sessions have been scheduled.'
        : `No upcoming ${activeConversationTopic} sessions have been scheduled.`;
      conversationGrid.append(empty);
      return;
    }
    visible.forEach((event, index) => {
      const card = document.createElement('article');
      card.className = `conversation-card${index === 0 ? ' featured' : ''}`;
      const top = document.createElement('div');
      top.className = 'card-topline';
      const type = document.createElement('span');
      type.className = 'topic-tag';
      type.textContent = event.event_type || 'Community session';
      const state = document.createElement('span');
      state.className = 'pill status-pill approved';
      state.textContent = 'Scheduled';
      top.append(type, state);
      const title = document.createElement('h3');
      title.textContent = event.title;
      const meta = document.createElement('p');
      meta.className = 'card-meta';
      meta.textContent = `${formatEventDate(event.date)} · ${event.venue || 'Venue to be announced'}`;
      const description = document.createElement('p');
      description.className = 'card-description';
      description.textContent = event.description || 'A curated session for community members.';
      const media = makeMediaNode(event.media_path, event.media_url, `${event.title} session attachment`);
      const info = document.createElement('div');
      info.className = 'card-info-row';
      const seats = document.createElement('span');
      seats.textContent = event.seats_available > 0
        ? `${Math.max(0, event.seats_available - (event.rsvp_count || 0))} seats available`
        : `${event.rsvp_count || 0} registered · No capacity limit`;
      const entry = document.createElement('span');
      entry.textContent = event.price || 'Member session';
      info.append(seats, entry);
      const rsvped = rsvpedEventIds.includes(event.id);
      const full = event.seats_available > 0 && event.rsvp_count >= event.seats_available && !rsvped;
      const rsvp = document.createElement('button');
      rsvp.type = 'button';
      rsvp.className = `btn ${rsvped ? 'btn-secondary' : 'btn-primary'}`;
      rsvp.textContent = rsvped ? 'Cancel RSVP' : (full ? 'Session full' : 'RSVP');
      rsvp.disabled = full;
      rsvp.addEventListener('click', async () => {
        rsvp.disabled = true;
        try {
          const result = await window.KGData.setEventRsvp(event.id, !rsvped);
          if (!result.success) throw new Error(result.message);
          await loadConversationListings();
          setStatus(conversationStatus, result.message, 'success');
        } catch (error) {
          setStatus(conversationStatus, error.message, 'error');
          rsvp.disabled = false;
        }
      });

      card.append(top, title, meta, description);
      if (media) card.append(media);
      card.append(info, rsvp);
      conversationGrid.append(card);
    });
  }

  async function loadConversationListings() {
    if (!conversationGrid || !window.KGData) return;
    setStatus(conversationStatus, 'Loading sessions…');
    try {
      const result = await window.KGData.loadEvents(false);
      renderConversationListings(result.events || [], result.rsvpedEventIds || []);
      setStatus(conversationStatus, `${(result.events || []).length} scheduled session${(result.events || []).length === 1 ? '' : 's'}.`);
    } catch (error) {
      conversationGrid.replaceChildren();
      setStatus(conversationStatus, error.message, 'error');
    }
  }

  async function loadAdminApplications() {
    if (!adminApplicationList || !window.KGData) return;
    try {
      const result = await window.KGData.loadApplications();
      pendingApplicationCount.textContent = String(result.pendingCount);
      if (approvedApplicantSelect) {
        const eligibleApplications = result.applications.filter(
          (application) => application.status === 'approved' && !application.auth_user_id
        );
        approvedApplicantSelect.replaceChildren();
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = eligibleApplications.length
          ? 'Select an approved applicant'
          : 'No approved applicants need an account';
        approvedApplicantSelect.append(placeholder);
        eligibleApplications.forEach((application) => {
          const option = document.createElement('option');
          option.value = application.id;
          option.textContent = `${application.full_name} — ${application.email}`;
          approvedApplicantSelect.append(option);
        });
        approvedApplicantSelect.disabled = eligibleApplications.length === 0;
        if (generateApplicantCodeButton) {
          generateApplicantCodeButton.disabled = true;
        }
      }
      adminApplicationList.replaceChildren();
      if (!result.applications.length) {
        const empty = document.createElement('li');
        empty.textContent = 'No applications have been submitted yet.';
        adminApplicationList.append(empty);
      }
      result.applications.forEach((application) => {
        const item = document.createElement('li');
        item.className = 'admin-application-row';
        const details = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = application.full_name;
        const business = document.createElement('p');
        business.textContent = [application.position, application.company].filter(Boolean).join(', ') || application.industry || 'Business profile not provided';
        const email = document.createElement('small');
        email.textContent = application.email;
        const accountState = document.createElement('small');
        accountState.textContent = application.auth_user_id
          ? 'Member account: created'
          : (application.status === 'approved'
            ? 'Member account: WhatsApp setup code needed'
            : 'Member account: not created');
        details.append(name, business, email, accountState);

        const status = document.createElement('select');
        status.className = 'application-status-select';
        status.setAttribute('aria-label', `Status for ${application.full_name}`);
        [
          ['pending', 'Pending'],
          ['review', 'Under review'],
          ['approved', 'Approved'],
          ['rejected', 'Rejected']
        ].forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          option.selected = application.status === value;
          status.append(option);
        });

        status.addEventListener('change', async function () {
          status.disabled = true;
          setStatus(applicationReviewStatus, 'Saving application status…');
          try {
            const update = await window.KGData.updateApplicationStatus(application.id, status.value);
            if (!update.success) throw new Error(update.message);
            await loadAdminApplications();
            if (status.value === 'approved' && !application.auth_user_id) {
              setStatus(applicationReviewStatus, 'Application approved. Generate a WhatsApp setup code below and send it privately to the applicant.', 'success');
            } else {
              setStatus(applicationReviewStatus, update.message, 'success');
            }
          } catch (error) {
            setStatus(applicationReviewStatus, error.message, 'error');
            status.value = application.status;
            status.disabled = false;
          }
        });
            const review = document.createElement('details');
            review.className = 'application-review-details';
            review.open = ['pending', 'review'].includes(application.status);
            const summary = document.createElement('summary');
            summary.textContent = 'Review full application';
            const fields = document.createElement('dl');
            fields.className = 'application-detail-list';
            [
              ['Phone', application.phone],
              ['Location', application.location],
              ['Company', application.company],
              ['Position', application.position],
              ['Industry', application.industry],
              ['Years in business', application.years_in_business],
              ['Website', application.website],
              ['LinkedIn', application.linkedin],
              ['Why join', application.why_join],
              ['Can contribute', application.contribute],
              ['Hopes to gain', application.gain],
              ['Referred by', application.referral],
              ['Submitted', formatRelativeDate(application.created_at)]
            ].forEach(([label, value]) => {
              if (value === null || value === undefined || value === '') return;
              const term = document.createElement('dt');
              term.textContent = label;
              const description = document.createElement('dd');
              description.textContent = String(value);
              fields.append(term, description);
            });
            if (application.profile_photo_url) {
              const photo = document.createElement('img');
              photo.className = 'application-photo';
              photo.src = application.profile_photo_url;
              photo.alt = `${application.full_name} application profile`;
              review.append(photo);
            }
            review.append(summary, fields);
            item.append(details, review, status);
            adminApplicationList.append(item);
      });
      if (!result.applications.length) setStatus(applicationReviewStatus, 'Application list is up to date.');
      else setStatus(applicationReviewStatus, '');
    } catch (error) {
      adminApplicationList.replaceChildren();
      const item = document.createElement('li');
      item.textContent = 'Applications could not be loaded.';
      adminApplicationList.append(item);
      pendingApplicationCount.textContent = '—';
      setStatus(applicationReviewStatus, error.message, 'error');
    }
  }

  approvedApplicantSelect?.addEventListener('change', () => {
    if (generateApplicantCodeButton) {
      generateApplicantCodeButton.disabled = !approvedApplicantSelect.value;
    }
  });

  generateApplicantCodeButton?.addEventListener('click', async () => {
    const applicationId = approvedApplicantSelect?.value;
    if (!applicationId) {
      setStatus(applicationReviewStatus, 'Select an approved applicant first.', 'error');
      return;
    }

    generateApplicantCodeButton.disabled = true;
    if (applicantSetupCodeResult) {
      applicantSetupCodeResult.hidden = true;
      applicantSetupCodeResult.replaceChildren();
    }
    setStatus(applicationReviewStatus, 'Creating a one-time WhatsApp setup code…');
    try {
      const result = await window.KGData.createApplicantWhatsAppCode(applicationId);
      if (!result.success) throw new Error(result.message);
      if (!applicantSetupCodeResult) throw new Error('The setup-code display is unavailable. Refresh the admin dashboard and try again.');

      const codeLabel = document.createElement('small');
      codeLabel.textContent = `One-time WhatsApp code (expires ${new Date(result.expiresAt).toLocaleTimeString()}):`;
      const codeValue = document.createElement('strong');
      codeValue.textContent = result.code;
      const copyCode = document.createElement('button');
      copyCode.type = 'button';
      copyCode.className = 'text-button';
      copyCode.textContent = 'Copy code';
      copyCode.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(result.code);
          setStatus(applicationReviewStatus, 'Code copied. Send it privately to the applicant using WhatsApp.', 'success');
        } catch (error) {
          setStatus(applicationReviewStatus, `Code could not be copied: ${error.message}`, 'error');
        }
      });
      const instructions = document.createElement('small');
      instructions.textContent = 'Send this code privately via WhatsApp. The applicant must enter it with their approved application email and a new password.';
      applicantSetupCodeResult.append(codeLabel, codeValue, copyCode, instructions);
      applicantSetupCodeResult.hidden = false;
      setStatus(applicationReviewStatus, result.message, 'success');
    } catch (error) {
      setStatus(applicationReviewStatus, error.message, 'error');
    } finally {
      generateApplicantCodeButton.disabled = !approvedApplicantSelect?.value;
    }
  });

  async function loadAdminDashboardStats() {
    if (!document.getElementById('adminTotalMembers') || !window.KGData) return;
    try {
      const stats = await window.KGData.loadAdminDashboardStats();
      document.getElementById('adminTotalMembers').textContent = String(stats.memberCount);
      document.getElementById('adminUpcomingEvents').textContent = String(stats.upcomingEvents);
      document.getElementById('adminForumDiscussions').textContent = String(stats.forumDiscussions);
      pendingApplicationCount.textContent = String(stats.pendingApplications);
      const latestMonthCount = stats.monthlyMemberCounts[stats.monthlyMemberCounts.length - 1] || 0;
      document.getElementById('adminMemberGrowth').textContent =
        `${latestMonthCount} new member${latestMonthCount === 1 ? '' : 's'} this month`;
      const chart = document.querySelector('.chart-bars');
      if (chart) {
        chart.replaceChildren();
        if (stats.monthlyMemberCounts.every((count) => count === 0)) {
          chart.textContent = 'No member registrations yet.';
        } else {
          const maximum = Math.max(1, ...stats.monthlyMemberCounts);
          stats.monthlyMemberCounts.forEach((count, index) => {
            const bar = document.createElement('span');
            bar.style.height = `${Math.max(8, Math.round((count / maximum) * 100))}%`;
            const month = new Date();
            month.setDate(1);
            month.setMonth(month.getMonth() - (stats.monthlyMemberCounts.length - index - 1));
            bar.title = `${new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(month)}: ${count} members joined`;
            chart.append(bar);
          });
          chart.setAttribute('aria-label', 'Member signups by month for the last six months');
        }
      }
    } catch (error) {
      document.getElementById('adminTotalMembers').textContent = '—';
      document.getElementById('adminUpcomingEvents').textContent = '—';
      document.getElementById('adminForumDiscussions').textContent = '—';
      document.getElementById('adminMemberGrowth').textContent = error.message;
      document.querySelector('.chart-bars')?.replaceChildren();
    }
  }

  async function loadMemberDashboard() {
    if (!memberUpcomingEvents || !window.KGData) return;
    setStatus(memberDashboardStatus, 'Loading your community…');
    try {
      const [stats, notifications] = await Promise.all([
        window.KGData.loadMemberDashboardStats(),
        window.KGData.loadNotifications()
      ]);
      document.getElementById('memberConnectionCount').textContent = String(stats.connectionCount);
      document.getElementById('memberConversationCount').textContent = String(stats.upcomingCount);
      document.getElementById('memberEventRsvpCount').textContent = String(stats.eventRsvps);
      document.getElementById('memberUnreadMessageCount').textContent = String(stats.unreadMessages);
      memberUpcomingEvents.replaceChildren();
      if (!stats.upcomingEvents.length) {
        const empty = document.createElement('p');
        empty.className = 'form-status';
        empty.textContent = 'No upcoming sessions are scheduled.';
        memberUpcomingEvents.append(empty);
      }
      stats.upcomingEvents.forEach((event) => {
        const row = document.createElement('article');
        row.className = 'conversation-item';
        const details = document.createElement('div');
        const category = document.createElement('span');
        category.className = 'conversation-tag';
        category.textContent = event.event_type || 'Community';
        const title = document.createElement('h4');
        title.textContent = event.title;
        const description = document.createElement('p');
        description.textContent = event.description || event.venue || 'Community session details';
        details.append(category, title, description);
        const date = document.createElement('div');
        date.className = 'meta-block';
        const dateText = document.createElement('strong');
        dateText.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(event.date));
        const timeText = document.createElement('span');
        timeText.textContent = new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(event.date));
        date.append(dateText, timeText);
        row.append(details, date);
        memberUpcomingEvents.append(row);
      });
      memberRecentNotifications.replaceChildren();
      const recent = notifications.slice(0, 3);
      if (!recent.length) {
        const empty = document.createElement('li');
        empty.textContent = 'No recent activity.';
        memberRecentNotifications.append(empty);
      }
      recent.forEach((notification, index) => {
        const item = document.createElement('li');
        const dot = document.createElement('span');
        dot.className = `activity-dot${['', 'gold', 'orange'][index] ? ` ${['', 'gold', 'orange'][index]}` : ''}`;
        const content = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = notification.title;
        const body = document.createElement('p');
        body.textContent = notification.body || '';
        content.append(title, body);
        const time = document.createElement('time');
        time.textContent = formatRelativeDate(notification.created_at);
        item.append(dot, content, time);
        memberRecentNotifications.append(item);
      });
      setStatus(memberDashboardStatus, 'Dashboard refreshed.');
    } catch (error) {
      setStatus(memberDashboardStatus, error.message, 'error');
      memberUpcomingEvents.replaceChildren();
      memberRecentNotifications.replaceChildren();
    }
  }

  async function loadSubscriptionPage() {
    const history = document.getElementById('subscriptionHistory');
    const historyStatus = document.getElementById('subscriptionHistoryStatus');
    const queue = document.getElementById('subscriptionPaymentQueue');
    const queueStatus = document.getElementById('subscriptionAdminStatus');
    if (!history || !window.KGData) return;
    setStatus(historyStatus, 'Loading subscription status…');
    try {
      const result = await window.KGData.loadSubscriptionPayments();
      const phoneInput = document.querySelector('#subscriptionPaymentForm [name="phone"]');
      if (phoneInput && result.profile.phone) phoneInput.value = result.profile.phone;
      history.replaceChildren();
      const activePayment = result.payments.find((payment) =>
        payment.status === 'verified' && payment.expires_at && new Date(payment.expires_at) > new Date()
      );
      setStatus(historyStatus, activePayment
        ? `Your subscription is active until ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(activePayment.expires_at))}.`
        : 'No active verified subscription was found.');
      if (!result.payments.length) {
        const empty = document.createElement('p');
        empty.className = 'form-status';
        empty.textContent = 'No subscription payments have been submitted yet.';
        history.append(empty);
      }
      result.payments.forEach((payment) => {
        const record = document.createElement('article');
        record.className = 'subscription-record';
        const heading = document.createElement('h3');
        heading.textContent = `UGX ${Number(payment.amount_ugx).toLocaleString()} · ${payment.status}`;
        const reference = document.createElement('p');
        reference.textContent = `Reference: ${payment.transaction_reference} · Phone: ${payment.payer_phone}`;
        const submitted = document.createElement('p');
        submitted.textContent = `Submitted ${formatRelativeDate(payment.created_at)}`;
        record.append(heading, reference, submitted);
        if (payment.expires_at) {
          const expiry = document.createElement('p');
          expiry.textContent = `Valid until ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(payment.expires_at))}`;
          record.append(expiry);
        }
        history.append(record);
      });
    } catch (error) {
      history.replaceChildren();
      setStatus(historyStatus, error.message, 'error');
    }

    if (!queue || !window.KG_IS_ADMIN) return;
    setStatus(queueStatus, 'Loading payment submissions…');
    try {
      const payments = await window.KGData.loadSubscriptionPaymentReviews();
      queue.replaceChildren();
      if (!payments.length) {
        const empty = document.createElement('p');
        empty.className = 'form-status';
        empty.textContent = 'No subscription payments have been submitted.';
        queue.append(empty);
      }
      payments.forEach((payment) => {
        const record = document.createElement('article');
        record.className = 'subscription-record';
        const heading = document.createElement('h3');
        heading.textContent = payment.profile?.full_name || 'Member';
        const details = document.createElement('p');
        details.textContent = `${payment.profile?.email || ''}${payment.profile?.company ? ` · ${payment.profile.company}` : ''}`;
        const transaction = document.createElement('p');
        transaction.textContent = `UGX ${Number(payment.amount_ugx).toLocaleString()} · ${payment.payment_method} · ${payment.payer_phone} · Ref: ${payment.transaction_reference}`;
        const status = document.createElement('p');
        status.textContent = `Status: ${payment.status} · Submitted ${formatRelativeDate(payment.created_at)}`;
        record.append(heading, details, transaction, status);
        if (payment.status === 'pending') {
          [['verified', 'Verify payment'], ['rejected', 'Reject payment']].forEach(([nextStatus, label]) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `btn ${nextStatus === 'verified' ? 'btn-primary' : 'btn-secondary'} small-btn`;
            button.textContent = label;
            button.addEventListener('click', async () => {
              button.disabled = true;
              try {
                const review = await window.KGData.reviewSubscriptionPayment(payment.id, nextStatus);
                if (!review.success) throw new Error(review.message);
                setStatus(queueStatus, review.message, 'success');
                await loadSubscriptionPage();
              } catch (error) {
                setStatus(queueStatus, error.message, 'error');
                button.disabled = false;
              }
            });
            record.append(button);
          });
        }
        queue.append(record);
      });
      setStatus(queueStatus, `${payments.length} payment submission${payments.length === 1 ? '' : 's'} loaded.`);
    } catch (error) {
      queue.replaceChildren();
      setStatus(queueStatus, error.message, 'error');
    }
  }

function formatEventDate(date) {
  if (!date) return 'Date to be announced';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return 'Date to be announced';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
}

function toDateTimeLocal(date) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  const offsetDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function resetEventForm() {
  if (!eventAdminForm) return;
  eventAdminForm.reset();
  eventAdminForm.elements.namedItem('id').value = '';
  eventFormHeading.textContent = 'Create an event';
  eventFormSubmit.textContent = 'Create event';
  const mediaHint = document.getElementById('eventMediaHint');
  if (mediaHint) mediaHint.textContent = '';
}

async function loadEvents() {
  if (!eventListing || !window.KGData) return;
  eventListing.replaceChildren();
  setStatus(eventPageStatus, 'Loading events…');
  try {
    const result = await window.KGData.loadEvents(Boolean(window.KG_IS_ADMIN));
    const events = result.events || [];
    const upcoming = events.filter((event) => event.status === 'published');
    nextEventSummary.textContent = upcoming[0]
      ? `${upcoming[0].title} · ${formatEventDate(upcoming[0].date)}`
      : 'No upcoming events have been scheduled.';
    upcomingEventHighlights.replaceChildren();
    upcoming.slice(0, 3).forEach((event, index) => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = ['Next event', 'Coming up', 'Also upcoming'][index];
      const title = document.createElement('strong');
      title.textContent = event.title;
      item.append(label, title);
      upcomingEventHighlights.append(item);
    });
    if (!upcoming.length) {
      const item = document.createElement('li');
      item.textContent = 'No upcoming events';
      upcomingEventHighlights.append(item);
    }

    if (!events.length) {
      setStatus(eventPageStatus, 'No events are published yet.');
      return;
    }
    setStatus(eventPageStatus, `${upcoming.length} upcoming event${upcoming.length === 1 ? '' : 's'}.`);

    events.forEach((event, index) => {
      const card = document.createElement('article');
      card.className = `event-card${index === 0 ? ' featured-event' : ''}${event.status === 'cancelled' ? ' is-cancelled' : ''}`;
      const image = document.createElement('div');
      image.className = `event-image image-${['one', 'two', 'three'][index % 3]}`;
      const eventMedia = makeMediaNode(event.media_path, event.media_url, `${event.title} event attachment`);
      if (eventMedia) image.append(eventMedia);
      else image.classList.add('event-image-empty');
      const content = document.createElement('div');
      content.className = 'event-content';
      const topRow = document.createElement('div');
      topRow.className = 'event-top-row';
      const type = document.createElement('span');
      type.className = 'event-type';
      type.textContent = event.event_type || 'Community event';
      const eventStatus = document.createElement('span');
      eventStatus.className = `event-status${event.status === 'cancelled' ? ' cancelled' : ''}`;
      eventStatus.textContent = event.status === 'cancelled' ? 'Cancelled' : 'Open';
      topRow.append(type, eventStatus);
      const title = document.createElement('h3');
      title.textContent = event.title;
      const date = document.createElement('p');
      date.className = 'event-date';
      date.textContent = `${formatEventDate(event.date)} · ${event.venue || 'Venue to be announced'}`;
      const description = document.createElement('p');
      description.textContent = event.description || 'Join fellow business leaders for a curated community event.';
      const meta = document.createElement('div');
      meta.className = 'event-meta';
      const capacity = document.createElement('span');
      capacity.textContent = event.seats_available > 0
        ? `Capacity: ${event.seats_available}`
        : 'Capacity: Unlimited';
      const remaining = document.createElement('span');
      remaining.textContent = event.seats_available > 0
        ? `${Math.max(0, event.seats_available - (event.rsvp_count || 0))} seats left`
        : `${event.rsvp_count || 0} registered`;
      if (event.price) remaining.textContent = `${remaining.textContent} · ${event.price}`;
      meta.append(capacity, remaining);
      content.append(topRow, title, date, description, meta);

      const actions = document.createElement('div');
      actions.className = 'event-actions';
      if (event.status === 'published') {
        const rsvped = result.rsvpedEventIds.includes(event.id);
        const full = event.seats_available > 0 && event.rsvp_count >= event.seats_available && !rsvped;
        const rsvp = document.createElement('button');
        rsvp.type = 'button';
        rsvp.className = `btn ${rsvped ? 'btn-secondary' : 'btn-primary'}`;
        rsvp.textContent = rsvped ? 'Cancel RSVP' : (full ? 'Event full' : 'RSVP');
        rsvp.disabled = full;
        rsvp.addEventListener('click', async () => {
          rsvp.disabled = true;
          setStatus(eventPageStatus, rsvped ? 'Cancelling your RSVP…' : 'Saving your RSVP…');
          try {
            const action = await window.KGData.setEventRsvp(event.id, !rsvped);
            if (!action.success) throw new Error(action.message);
            await loadEvents();
            setStatus(eventPageStatus, action.message, 'success');
          } catch (error) {
            setStatus(eventPageStatus, error.message, 'error');
            rsvp.disabled = false;
          }
        });
        actions.append(rsvp);
      }
      if (window.KG_IS_ADMIN) {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'btn btn-secondary';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => {
          eventAdminForm.elements.namedItem('id').value = event.id;
          eventAdminForm.elements.namedItem('title').value = event.title || '';
          eventAdminForm.elements.namedItem('eventType').value = event.event_type || '';
          eventAdminForm.elements.namedItem('date').value = toDateTimeLocal(event.date);
          eventAdminForm.elements.namedItem('venue').value = event.venue || '';
          eventAdminForm.elements.namedItem('seatsAvailable').value = String(event.seats_available || 0);
          eventAdminForm.elements.namedItem('price').value = event.price || '';
          eventAdminForm.elements.namedItem('description').value = event.description || '';
          const mediaHint = document.getElementById('eventMediaHint');
          if (mediaHint) mediaHint.textContent = event.media_path ? 'An attachment is already saved. Choose a file only to replace it.' : '';
          eventFormHeading.textContent = 'Edit event';
          eventFormSubmit.textContent = 'Save event';
          eventAdminForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        actions.append(edit);
        if (event.status === 'published') {
          const cancel = document.createElement('button');
          cancel.type = 'button';
          cancel.className = 'btn btn-secondary';
          cancel.textContent = 'Cancel event';
          cancel.addEventListener('click', async () => {
            if (!window.confirm(`Cancel "${event.title}"?`)) return;
            cancel.disabled = true;
            try {
              const action = await window.KGData.cancelEvent(event.id);
              if (!action.success) throw new Error(action.message);
              await loadEvents();
              setStatus(eventPageStatus, action.message, 'success');
            } catch (error) {
              setStatus(eventPageStatus, error.message, 'error');
              cancel.disabled = false;
            }
          });
          actions.append(cancel);
        }
      }
      content.append(actions);
      card.append(image, content);
      eventListing.append(card);
    });
  } catch (error) {
    eventListing.replaceChildren();
    setStatus(eventPageStatus, error.message, 'error');
  }
}

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function renderForumPosts() {
  if (!forumPostList) return;
  forumPostList.replaceChildren();
  const visiblePosts = forumPosts.filter((post) =>
    activeForumTopic === 'all' || post.topic === activeForumTopic
  );
  if (!visiblePosts.length) {
    const empty = document.createElement('p');
    empty.className = 'form-status';
    empty.textContent = activeForumTopic === 'all'
      ? 'No discussions have been posted yet. Start the first one.'
      : `No ${activeForumTopic} discussions yet.`;
    forumPostList.append(empty);
    return;
  }

  visiblePosts.forEach((post, index) => {
    const article = document.createElement('article');
    article.className = 'forum-post';
    const header = document.createElement('div');
    header.className = 'post-header';
    const author = document.createElement('div');
    author.className = 'post-author';
    const avatar = document.createElement('div');
    avatar.className = `mini-avatar ${['alt', 'warm', ''][index % 3]}`.trim();
    const authorName = String(post.author || 'Member').trim();
    avatar.textContent = authorName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
    const authorDetails = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = authorName;
    const meta = document.createElement('span');
    meta.textContent = `${post.topic || 'General'} · ${formatRelativeDate(post.created_at)}`;
    authorDetails.append(name, meta);
    author.append(avatar, authorDetails);
    const topic = document.createElement('span');
    topic.className = 'status-pill approved';
    topic.textContent = post.topic || 'General';
    header.append(author, topic);
    const title = document.createElement('h3');
    title.textContent = post.topic || 'Community discussion';
    const body = document.createElement('p');
    body.textContent = post.content;
    const attachment = makeMediaNode(post.media_path, post.media_url, `${authorName} discussion attachment`);
    const actions = document.createElement('div');
    actions.className = 'post-actions';
    if (post.user_id !== window.KG_CURRENT_PROFILE?.auth_user_id) {
      const report = document.createElement('button');
      report.type = 'button';
      report.className = 'text-button';
      report.textContent = 'Report';
      report.addEventListener('click', async () => {
        const reason = window.prompt('Briefly describe why you are reporting this discussion:');
        if (reason === null) return;
        if (!reason.trim()) {
          setStatus(forumFeedStatus, 'Enter a reason before submitting the report.', 'error');
          return;
        }
        report.disabled = true;
        try {
          const result = await window.KGData.reportForumPost({ postId: post.id, reason: reason.trim() });
          if (!result.success) throw new Error(result.message);
          setStatus(forumFeedStatus, result.message, 'success');
        } catch (error) {
          setStatus(forumFeedStatus, error.message, 'error');
        } finally {
          report.disabled = false;
        }
      });
      actions.append(report);
    }
    article.append(header, title, body);
    if (attachment) article.append(attachment);
    article.append(actions);
    forumPostList.append(article);
  });
}

async function loadCommunityForum() {
  if (!forumPostList || !window.KGData) return;
  setStatus(forumFeedStatus, 'Loading discussions…');
  try {
    forumPosts = await window.KGData.loadForumPosts();
    renderForumPosts();
    setStatus(forumFeedStatus, `${forumPosts.length} discussion${forumPosts.length === 1 ? '' : 's'}.`);
    if (forumActivitySummary) {
      forumActivitySummary.textContent = `${forumPosts.length} discussion${forumPosts.length === 1 ? '' : 's'} shared by members.`;
    }
    if (forumTrendingList) {
      forumTrendingList.replaceChildren();
      const topicCounts = new Map();
      forumPosts.forEach((post) => topicCounts.set(post.topic || 'General', (topicCounts.get(post.topic || 'General') || 0) + 1));
      const topTopics = [...topicCounts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3);
      if (!topTopics.length) {
        const item = document.createElement('li');
        item.textContent = 'No topics yet';
        forumTrendingList.append(item);
      }
      topTopics.forEach(([topicName, count]) => {
        const item = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = topicName;
        const total = document.createElement('em');
        total.textContent = `${count} post${count === 1 ? '' : 's'}`;
        item.append(label, total);
        forumTrendingList.append(item);
      });
    }
  } catch (error) {
    forumPosts = [];
    renderForumPosts();
    setStatus(forumFeedStatus, error.message, 'error');
    if (forumActivitySummary) forumActivitySummary.textContent = 'Community activity could not be loaded.';
  }
}

function renderModerationQueue() {
  if (!moderationQueue) return;
  moderationQueue.replaceChildren();
  const visibleReports = forumReports.filter((report) =>
    activeReportFilter === 'all' || report.status === activeReportFilter
  );
  if (!visibleReports.length) {
    const empty = document.createElement('p');
    empty.className = 'form-status';
    empty.textContent = activeReportFilter === 'all'
      ? 'There are no community reports to review.'
      : `There are no ${activeReportFilter} reports.`;
    moderationQueue.append(empty);
    return;
  }

  visibleReports.forEach((report) => {
    const item = document.createElement('article');
    item.className = 'moderation-item';
    const header = document.createElement('div');
    header.className = 'moderation-head';
    const identity = document.createElement('div');
    identity.className = 'post-author';
    const avatar = document.createElement('div');
    avatar.className = 'mini-avatar alt';
    avatar.textContent = 'R';
    const details = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = 'Member report';
    const submitted = document.createElement('span');
    submitted.textContent = `Forum post · ${formatRelativeDate(report.created_at)}`;
    details.append(name, submitted);
    identity.append(avatar, details);
    const status = document.createElement('span');
    status.className = `status-pill ${report.status === 'pending' ? 'review' : 'approved'}`;
    status.textContent = report.status;
    header.append(identity, status);
    const title = document.createElement('h3');
    title.textContent = report.reason;
    const message = document.createElement('p');
    message.textContent = report.details || 'No additional details were provided.';
    item.append(header, title, message);
    if (report.post) {
      const postContent = document.createElement('blockquote');
      postContent.textContent = `${report.post.author || 'Member'} · ${report.post.topic || 'General'}: ${report.post.content}`;
      item.append(postContent);
    } else {
      const unavailable = document.createElement('p');
      unavailable.textContent = 'The reported discussion is no longer available.';
      item.append(unavailable);
    }
    if (report.status === 'pending') {
      const actions = document.createElement('div');
      actions.className = 'moderation-actions';
      [['resolved', 'Mark resolved'], ['dismissed', 'Dismiss']].forEach(([nextStatus, label]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn ${nextStatus === 'resolved' ? 'btn-primary' : 'btn-secondary'} small-btn`;
        button.textContent = label;
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            const result = await window.KGData.updateForumReportStatus(report.id, nextStatus);
            if (!result.success) throw new Error(result.message);
            await loadModerationQueue();
            setStatus(moderationQueueStatus, result.message, 'success');
          } catch (error) {
            setStatus(moderationQueueStatus, error.message, 'error');
            button.disabled = false;
          }
        });
        actions.append(button);
      });
      item.append(actions);
    }
    moderationQueue.append(item);
  });
}

async function loadModerationQueue() {
  if (!moderationQueue || !window.KGData) return;
  setStatus(moderationQueueStatus, 'Loading moderation reports…');
  try {
    forumReports = await window.KGData.loadForumReports();
    const pending = forumReports.filter((report) => report.status === 'pending').length;
    const completed = forumReports.length - pending;
    moderationPendingCount.textContent = String(pending);
    moderationTotalCount.textContent = String(forumReports.length);
    moderationResolvedCount.textContent = String(completed);
    moderationQueueSummary.textContent = `${pending} report${pending === 1 ? '' : 's'} awaiting review`;
    renderModerationQueue();
    setStatus(moderationQueueStatus, `${forumReports.length} report${forumReports.length === 1 ? '' : 's'} loaded.`);
  } catch (error) {
    forumReports = [];
    renderModerationQueue();
    setStatus(moderationQueueStatus, error.message, 'error');
    moderationQueueSummary.textContent = 'Reports could not be loaded.';
    moderationPendingCount.textContent = '—';
    moderationTotalCount.textContent = '—';
    moderationResolvedCount.textContent = '—';
  }
}

function initialsFor(name) {
  return String(name || 'Member')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function makeMediaNode(path, url, label) {
  if (!path || !url) return null;
  const extension = path.split('.').pop().toLowerCase().split('?')[0];
  const isVoiceMessage = path.split('/').pop().startsWith('voice-');
  if (isVoiceMessage && extension === 'webm') {
    const audio = document.createElement('audio');
    audio.src = url;
    audio.controls = true;
    audio.preload = 'metadata';
    audio.setAttribute('aria-label', label || 'Voice message');
    return audio;
  }
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'community-media-link';
    const image = document.createElement('img');
    image.src = url;
    image.alt = label || 'Community attachment';
    image.loading = 'lazy';
    link.append(image);
    return link;
  }
  if (['mp4', 'webm'].includes(extension)) {
    const video = document.createElement('video');
    video.src = url;
    video.controls = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', label || 'Community video');
    return video;
  }
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.className = 'community-media-document';
  link.textContent = `Open attachment${label ? `: ${label}` : ''}`;
  return link;
}

function setMemberAvatar(element, photoUrl, name) {
  if (!element) return;
  if (photoUrl) {
    const image = document.createElement('img');
    image.className = 'member-photo-avatar';
    image.src = photoUrl;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    element.replaceChildren(image);
    return;
  }
  element.textContent = initialsFor(name);
}

function renderMessages() {
  document.body.classList.toggle('has-active-chat', Boolean(activeMessagePartnerId));
  if (!chatList || !chatThread || !messageProfile) return;
  const memberById = new Map(messageDirectory.map((member) => [member.id, member]));
  const conversations = new Map();
  directMessages.forEach((message) => {
    const partnerId = message.sender_profile_id === messageProfile.id
      ? message.recipient_profile_id
      : message.sender_profile_id;
    const current = conversations.get(partnerId);
    if (!current || new Date(message.created_at) > new Date(current.created_at)) {
      conversations.set(partnerId, message);
    }
  });
  if (activeMessagePartnerId && !conversations.has(activeMessagePartnerId)) {
    conversations.set(activeMessagePartnerId, null);
  }
  const search = (document.getElementById('messageSearch')?.value || '').trim().toLowerCase();
  const sorted = [...conversations.entries()]
    .filter(([partnerId]) => {
      const partner = memberById.get(partnerId);
      return partner && (partner.full_name || '').toLowerCase().includes(search);
    })
    .sort((left, right) => {
      const leftDate = left[1] ? new Date(left[1].created_at).getTime() : 0;
      const rightDate = right[1] ? new Date(right[1].created_at).getTime() : 0;
      return rightDate - leftDate;
    });

  chatList.replaceChildren();
  if (!sorted.length) {
    const empty = document.createElement('p');
    empty.className = 'form-status';
    empty.textContent = search ? 'No conversations match that search.' : 'No messages yet. Start a conversation with a member.';
    chatList.append(empty);
  }
  sorted.forEach(([partnerId, latest], index) => {
    const partner = memberById.get(partnerId);
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `chat-item${partnerId === activeMessagePartnerId ? ' active' : ''}`;
    item.setAttribute('aria-pressed', String(partnerId === activeMessagePartnerId));
    const avatar = document.createElement('span');
    avatar.className = `mini-avatar ${['', 'alt', 'warm'][index % 3]}`.trim();
    setMemberAvatar(avatar, partner.profile_photo_url, partner.full_name);
    const copy = document.createElement('span');
    copy.className = 'chat-item-copy';
    const topline = document.createElement('span');
    topline.className = 'chat-topline';
    const name = document.createElement('strong');
    name.textContent = partner.full_name || 'Member';
    const time = document.createElement('span');
    time.textContent = latest ? formatRelativeDate(latest.created_at) : 'New';
    topline.append(name, time);
    const preview = document.createElement('span');
    preview.textContent = latest?.content || (latest?.media_path
      ? (latest.media_error
        ? 'Attachment unavailable'
        : (latest.media_path.split('/').pop().startsWith('voice-') ? 'Voice message' : 'Attachment'))
      : 'Start a conversation');
    copy.append(topline, preview);
    item.append(avatar, copy);
    item.addEventListener('click', () => openMessageConversation(partnerId));
    chatList.append(item);
  });

  const partner = memberById.get(activeMessagePartnerId);
  const nameNode = document.getElementById('activeChatName');
  const initialsNode = document.getElementById('activeChatInitials');
  const profileLink = document.getElementById('activeChatProfile');
  const metaNode = document.getElementById('activeChatMeta');
  const sendButton = document.getElementById('sendMessageButton');
  if (!partner) {
    nameNode.textContent = 'Select a conversation';
    initialsNode.textContent = initialsFor(messageProfile.full_name);
    metaNode.textContent = 'Your member messages are private.';
    profileLink.href = 'members-directory.html';
    chatThread.replaceChildren();
    const prompt = document.createElement('p');
    prompt.textContent = 'Select a member to view your conversation.';
    chatThread.append(prompt);
    sendButton.disabled = true;
    document.getElementById('startAudioCallButton').disabled = true;
    document.getElementById('startVideoCallButton').disabled = true;
    document.getElementById('recordVoiceMessageButton').disabled = false;
    return;
  }
  nameNode.textContent = partner.full_name || 'Member';
  initialsNode.textContent = initialsFor(partner.full_name);
  profileLink.href = 'members-directory.html';
  const threadMessages = directMessages.filter((message) =>
    (message.sender_profile_id === messageProfile.id && message.recipient_profile_id === activeMessagePartnerId) ||
    (message.recipient_profile_id === messageProfile.id && message.sender_profile_id === activeMessagePartnerId)
  );
  const hasExistingConversation = threadMessages.length > 0;
  metaNode.textContent = partner.allow_dm
    ? 'Member messages are private.'
    : 'New conversations are off; this conversation remains open.';
  sendButton.disabled = !(partner.allow_dm || hasExistingConversation);
  document.getElementById('recordVoiceMessageButton').disabled = false;
  document.getElementById('startAudioCallButton').disabled = !hasExistingConversation || Boolean(activeCall);
  document.getElementById('startVideoCallButton').disabled = !hasExistingConversation || Boolean(activeCall);
  chatThread.replaceChildren();
  if (!threadMessages.length) {
    const prompt = document.createElement('p');
    prompt.textContent = `You can start a private conversation with ${partner.full_name}.`;
    chatThread.append(prompt);
  }
  threadMessages.forEach((message) => {
    const bubble = document.createElement('article');
    bubble.className = `message ${message.sender_profile_id === messageProfile.id ? 'sent' : 'received'}`;
    if (message.content) {
      const body = document.createElement('p');
      body.textContent = message.content;
      bubble.append(body);
    }
    const isVoiceMessage = message.media_path?.split('/').pop().startsWith('voice-');
    const attachment = makeMediaNode(message.media_path, message.media_url, isVoiceMessage ? 'Voice message' : 'Message attachment');
    if (attachment) {
      bubble.append(attachment);
    } else if (message.media_path) {
      const attachmentStatus = document.createElement('p');
      attachmentStatus.className = 'form-status error';
      attachmentStatus.textContent = `Attachment unavailable: ${message.media_error || 'the file could not be opened.'}`;
      bubble.append(attachmentStatus);
    }
    const time = document.createElement('time');
    time.dateTime = message.created_at;
    time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(message.created_at));
    bubble.append(time);
    chatThread.append(bubble);
  });
  chatThread.scrollTop = chatThread.scrollHeight;
}

function setCallPanelState(title, status, controls = {}) {
  callPanel.hidden = false;
  callPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  document.getElementById('directCallTitle').textContent = title;
  callInboxStatus.textContent = status;
  const acceptButton = document.getElementById('acceptCallButton');
  const declineButton = document.getElementById('declineCallButton');
  acceptButton.hidden = !controls.accept;
  declineButton.hidden = !controls.decline;
  acceptButton.disabled = false;
  declineButton.disabled = false;
  document.getElementById('muteCallButton').hidden = !controls.active;
  document.getElementById('toggleCallCameraButton').hidden = !controls.active || activeCall?.mode !== 'video';
  document.getElementById('hangupCallButton').hidden = !controls.active;
}

function updateCallMediaElements(call) {
  const remoteStream = call.remoteStream || null;
  localCallVideo.srcObject = call.localStream || null;
  localCallVideo.hidden = call.mode !== 'video' || !call.localStream;
  remoteCallVideo.srcObject = call.mode === 'video' ? remoteStream : null;
  remoteCallVideo.hidden = call.mode !== 'video' || !remoteStream;
  remoteCallAudio.srcObject = call.mode === 'audio' ? remoteStream : null;
  remoteCallAudio.hidden = call.mode !== 'audio' || !remoteStream;
}

function createDirectCallPeer(call) {
  const peer = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  call.peer = peer;
  call.localStream.getTracks().forEach((track) => peer.addTrack(track, call.localStream));
  peer.ontrack = (event) => {
    call.remoteStream = event.streams[0] || new MediaStream([event.track]);
    remoteCallVideo.srcObject = call.mode === 'video' ? call.remoteStream : null;
    remoteCallVideo.hidden = call.mode !== 'video';
    remoteCallAudio.srcObject = call.mode === 'audio' ? call.remoteStream : null;
    remoteCallAudio.hidden = call.mode !== 'audio';
    if (call.mode === 'video') remoteCallVideo.play().catch(() => {});
    else remoteCallAudio.play().catch(() => {});
    callInboxStatus.textContent = 'Connected';
  };
  peer.onicecandidate = (event) => {
    if (event.candidate && activeCall === call) {
      call.signaling.send({
        type: 'candidate',
        callId: call.id,
        candidate: event.candidate.toJSON()
      }).catch((error) => setStatus(messageStatus, error.message, 'error'));
    }
  };
  peer.onconnectionstatechange = () => {
    if (peer.connectionState === 'failed') {
      void endDirectCall(false, 'Call connection failed. Try again or use a different network.', 'error');
    }
  };
  updateCallMediaElements(call);
  return peer;
}

async function flushDirectCallCandidates(call) {
  if (!call.peer.remoteDescription) return;
  for (const candidate of call.pendingCandidates.splice(0)) {
    await call.peer.addIceCandidate(new RTCIceCandidate(candidate));
  }
}

async function handleDirectCallSignal(call, payload) {
  if (activeCall !== call || payload?.callId !== call.id) return;
  if (payload.type === 'declined') {
    await endDirectCall(false, 'The member declined the call.');
  } else if (payload.type === 'hangup') {
    await endDirectCall(false, 'The member ended the call.');
  } else if (payload.type === 'accepted' && call.role === 'caller') {
    call.accepted = true;
    window.clearTimeout(call.timeout);
    setCallPanelState(`Calling ${call.partnerName}`, 'Connecting…', { active: true });
    const peer = createDirectCallPeer(call);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await call.signaling.send({ type: 'offer', callId: call.id, description: peer.localDescription });
  } else if (payload.type === 'offer' && call.role === 'callee') {
    await call.peer.setRemoteDescription(new RTCSessionDescription(payload.description));
    await flushDirectCallCandidates(call);
    const answer = await call.peer.createAnswer();
    await call.peer.setLocalDescription(answer);
    await call.signaling.send({ type: 'answer', callId: call.id, description: call.peer.localDescription });
  } else if (payload.type === 'answer' && call.role === 'caller') {
    await call.peer.setRemoteDescription(new RTCSessionDescription(payload.description));
    await flushDirectCallCandidates(call);
  } else if (payload.type === 'candidate') {
    if (!call.peer || !call.peer.remoteDescription) call.pendingCandidates.push(payload.candidate);
    else await call.peer.addIceCandidate(new RTCIceCandidate(payload.candidate));
  }
}

async function endDirectCall(sendSignal, status, tone = '') {
  const call = activeCall;
  activeCall = null;
  incomingCall = null;
  if (call) {
    window.clearTimeout(call.timeout);
    call.peer?.close();
    call.localStream?.getTracks().forEach((track) => track.stop());
  }
  localCallVideo.srcObject = null;
  remoteCallVideo.srcObject = null;
  remoteCallAudio.srcObject = null;
  callPanel.hidden = true;
  if (status) setStatus(messageStatus, status, tone);
  renderMessages();
  if (call) {
    if (sendSignal && call.signaling) {
      try {
        await call.signaling.send({ type: 'hangup', callId: call.id });
      } catch (error) {
        setStatus(messageStatus, error.message, 'error');
      }
    }
    try {
      if (call.id) await window.KGData.deleteDirectCallInvite(call.id);
    } catch (error) {
      setStatus(messageStatus, error.message, 'error');
    }
    if (call.signaling) {
      try {
        await call.signaling.close();
      } catch (error) {
        setStatus(messageStatus, `Call signaling could not close cleanly: ${error.message}`, 'error');
      }
    }
  }
}

async function startDirectCall(mode) {
  if (!activeMessagePartnerId || activeCall) return;
  const partner = messageDirectory.find((member) => member.id === activeMessagePartnerId);
  if (!partner) {
    setStatus(messageStatus, 'Select a member before starting a call.', 'error');
    return;
  }
  if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
    setStatus(messageStatus, 'Calls need a supported browser and a secure HTTPS connection.', 'error');
    return;
  }
  const call = {
    id: crypto.randomUUID(),
    partnerId: partner.id,
    partnerName: partner.full_name || 'Member',
    mode,
    role: 'caller',
    pendingCandidates: []
  };
  activeCall = call;
  renderMessages();
  setCallPanelState(`Calling ${call.partnerName}`, 'Allow microphone access to start the call…');
  try {
    call.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video'
    });
    updateCallMediaElements(call);
    call.signaling = await window.KGData.openDirectCallChannel(call.partnerId, (payload) => {
      void handleDirectCallSignal(call, payload).catch((error) => {
        setStatus(messageStatus, error.message, 'error');
        void endDirectCall(false, 'The call could not be connected.', 'error');
      });
    });
    call.timeout = window.setTimeout(() => {
      if (activeCall === call) void endDirectCall(true, 'No answer. The call ended.');
    }, 45000);
    await window.KGData.sendDirectCallInvite(call.partnerId, {
      type: 'invite',
      callId: call.id,
      callerProfileId: messageProfile.id,
      recipientProfileId: call.partnerId,
      mode
    });
    if (!call.accepted) setCallPanelState(`Calling ${call.partnerName}`, 'Ringing…', { active: true });
  } catch (error) {
    await endDirectCall(false, error.message, 'error');
  }
}

async function handleIncomingDirectCall(payload) {
  const inviteCreatedAt = Date.parse(payload?.createdAt || '');
  if (
    payload?.type === 'invite' &&
    payload.callId &&
    Number.isFinite(inviteCreatedAt) &&
    Date.now() - inviteCreatedAt > 45000
  ) {
    await window.KGData.deleteDirectCallInvite(payload.callId);
    return;
  }
  if (
    payload?.type !== 'invite' ||
    payload.recipientProfileId !== messageProfile?.id ||
    !payload.callId ||
    !Number.isFinite(inviteCreatedAt) ||
    Date.now() - inviteCreatedAt > 45000 ||
    inviteCreatedAt > Date.now() + 5000 ||
    !['audio', 'video'].includes(payload.mode)
  ) return;
  if (seenCallInviteIds.has(payload.callId)) return;
  seenCallInviteIds.add(payload.callId);
  if (activeCall || incomingCall) {
    const busyChannel = await window.KGData.openDirectCallChannel(payload.callerProfileId, () => {});
    try {
      await busyChannel.send({ type: 'declined', callId: payload.callId });
    } finally {
      try {
        await busyChannel.close();
      } finally {
        await window.KGData.deleteDirectCallInvite(payload.callId);
      }
    }
    return;
  }
  const caller = messageDirectory.find((member) => member.id === payload.callerProfileId);
  if (!caller) return;
  const call = {
    id: payload.callId,
    partnerId: caller.id,
    partnerName: caller.full_name || 'Member',
    mode: payload.mode,
    role: 'callee',
    pendingCandidates: []
  };
  activeCall = call;
  incomingCall = payload;
  try {
    await openMessageConversation(caller.id);
    call.signaling = await window.KGData.openDirectCallChannel(caller.id, (signal) => {
      void handleDirectCallSignal(call, signal).catch((error) => {
        setStatus(messageStatus, error.message, 'error');
        void endDirectCall(false, 'The call could not be connected.', 'error');
      });
    });
  } catch (error) {
    await endDirectCall(false, error.message, 'error');
    throw error;
  }
  setCallPanelState(
    `${call.partnerName} is calling`,
    `Incoming ${call.mode} call`,
    { accept: true, decline: true }
  );
  call.timeout = window.setTimeout(() => {
    if (activeCall === call) void endDirectCall(true, 'The call invitation expired.');
  }, 45000);
}

async function ensureDirectCallInbox() {
  if (callInboxChannel || callInboxPending || !messageProfile) return;
  callInboxPending = true;
  try {
    callInboxChannel = await window.KGData.subscribeToDirectCallInbox(
      messageProfile.id,
      (payload) => {
        void handleIncomingDirectCall(payload).catch((error) => {
          setStatus(messageStatus, error.message, 'error');
        });
      }
    );
  } catch (error) {
    setStatus(messageStatus, `Calls are unavailable: ${error.message}`, 'error');
  } finally {
    callInboxPending = false;
  }
}

async function openMessageConversation(partnerId) {
  if (!partnerId) return;
  activeMessagePartnerId = partnerId;
  const result = await window.KGData.markDirectMessagesRead(partnerId);
  if (!result.success) setStatus(messageStatus, result.message, 'error');
  else setStatus(messageStatus, '');
  renderMessages();
}

async function loadMessages() {
  if (!chatList || !window.KGData) return;
  setStatus(messageListStatus, 'Loading messages…');
  try {
    const [messageResult, members] = await Promise.all([
      window.KGData.loadDirectMessages(),
      window.KGData.loadMemberDirectory()
    ]);
    directMessages = messageResult.messages;
    messageProfile = messageResult.profile;
    messageDirectory = members;
    void ensureDirectCallInbox();
    const recipientSelect = newMessageRecipient;
    if (recipientSelect) {
      const availableRecipients = members.filter((member) => member.allow_dm && member.id !== messageProfile.id);
      recipientSelect.replaceChildren();
      const prompt = document.createElement('option');
      prompt.value = '';
      prompt.textContent = availableRecipients.length
        ? 'Choose a member who accepts messages'
        : 'No other members are accepting messages yet';
      recipientSelect.append(prompt);
      availableRecipients.forEach((member) => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.full_name}${member.company ? ` · ${member.company}` : ''}`;
        recipientSelect.append(option);
      });
      const startMessageButton = document.getElementById('startMessageButton');
      if (startMessageButton) startMessageButton.disabled = !availableRecipients.length;
      setStatus(
        document.getElementById('newMessageAvailability'),
        availableRecipients.length
          ? ''
          : 'A second member must join and allow direct messages before you can start a conversation.'
      );
    }
    renderMessages();
    const unread = directMessages.filter((message) =>
      message.recipient_profile_id === messageProfile.id && !message.read_at
    ).length;
    setStatus(messageListStatus, `${directMessages.length} message${directMessages.length === 1 ? '' : 's'} · ${unread} unread.`);
    const requestedRecipient = new URLSearchParams(window.location.search).get('to');
    const initialRecipient = messageDirectory.find((member) => member.id === requestedRecipient && member.allow_dm);
    if (initialRecipient) await openMessageConversation(initialRecipient.id);
  } catch (error) {
    directMessages = [];
    messageDirectory = [];
    renderMessages();
    setStatus(messageListStatus, error.message, 'error');
  }
}

function resetResourceForm() {
  if (!resourceAdminForm) return;
  resourceAdminForm.reset();
  resourceAdminForm.elements.namedItem('id').value = '';
  resourceFormHeading.textContent = 'Add a resource';
  resourceFormSubmit.textContent = 'Add resource';
}

function renderResources() {
  if (!resourceGrid) return;
  const visibleItems = resourceItems.filter((resource) =>
    activeResourceCategory === 'all' || resource.category === activeResourceCategory
  );
  resourceGrid.replaceChildren();
  if (!visibleItems.length) {
    const empty = document.createElement('p');
    empty.className = 'form-status';
    empty.textContent = activeResourceCategory === 'all'
      ? 'No resources have been published yet.'
      : `No resources in ${activeResourceCategory} yet.`;
    resourceGrid.append(empty);
    return;
  }
  const previews = ['preview-gold', 'preview-blue', 'preview-amber', 'preview-slate', 'preview-peach', 'preview-rose'];
  visibleItems.forEach((resource, index) => {
    const card = document.createElement('article');
    card.className = `resource-card${index === 0 ? ' featured' : ''}`;
    const top = document.createElement('div');
    top.className = 'resource-card-top';
    const category = document.createElement('span');
    category.className = 'topic-tag';
    category.textContent = resource.category;
    const state = document.createElement('span');
    state.className = 'resource-read';
    state.textContent = resource.published ? 'Member resource' : 'Draft';
    top.append(category, state);
    const preview = document.createElement('div');
    preview.className = `resource-preview ${previews[index % previews.length]}`;
    const resourceMedia = makeMediaNode(resource.media_path, resource.media_url, resource.title);
    if (resourceMedia) preview.append(resourceMedia);
    else {
      const previewLabel = document.createElement('span');
      previewLabel.textContent = resource.resource_url ? 'Linked resource' : 'Member guide';
      preview.append(previewLabel);
    }
    const title = document.createElement('h3');
    title.textContent = resource.title;
    const summary = document.createElement('p');
    summary.textContent = resource.summary;
    const meta = document.createElement('div');
    meta.className = 'resource-meta';
    const date = document.createElement('span');
    date.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(resource.updated_at || resource.created_at));
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'text-button';
    open.textContent = resource.resource_url ? 'Open link' : resource.media_path ? 'Open resource' : 'Read guide';
    open.addEventListener('click', () => {
      if (resource.resource_url) {
        window.open(resource.resource_url, '_blank', 'noopener,noreferrer');
        if (resource.content || resource.media_path) showResourceDialog(resource);
      } else {
        showResourceDialog(resource);
      }
    });
    meta.append(date, open);
    card.append(top, preview, title, summary, meta);
    if (window.KG_IS_ADMIN) {
      const adminActions = document.createElement('div');
      adminActions.className = 'resource-admin-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn btn-secondary small-btn';
      edit.textContent = 'Edit';
      edit.addEventListener('click', () => {
        resourceAdminForm.elements.namedItem('id').value = resource.id;
        resourceAdminForm.elements.namedItem('title').value = resource.title;
        resourceAdminForm.elements.namedItem('category').value = resource.category;
        resourceAdminForm.elements.namedItem('summary').value = resource.summary;
        resourceAdminForm.elements.namedItem('content').value = resource.content || '';
        resourceAdminForm.elements.namedItem('resourceUrl').value = resource.resource_url || '';
        resourceAdminForm.elements.namedItem('published').checked = resource.published;
        resourceFormHeading.textContent = 'Edit resource';
        resourceFormSubmit.textContent = 'Save changes';
        resourceAdminForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      adminActions.append(edit);
      card.append(adminActions);
    }
    resourceGrid.append(card);
  });
}

function showResourceDialog(resource) {
  if (!resourceDialog) return;
  document.getElementById('resourceDialogCategory').textContent = resource.category;
  document.getElementById('resourceDialogTitle').textContent = resource.title;
  document.getElementById('resourceDialogContent').textContent = resource.content || resource.summary;
  const media = document.getElementById('resourceDialogMedia');
  if (media) {
    media.replaceChildren();
    const node = makeMediaNode(resource.media_path, resource.media_url, resource.title);
    if (node) media.append(node);
  }
  const link = document.getElementById('resourceDialogLink');
  link.hidden = !resource.resource_url;
  if (resource.resource_url) link.href = resource.resource_url;
  resourceDialog.showModal();
}

async function loadResourceLibrary() {
  if (!resourceGrid || !window.KGData) return;
  setStatus(resourceStatus, 'Loading resources…');
  try {
    resourceItems = await window.KGData.loadResources(Boolean(window.KG_IS_ADMIN));
    const categories = [...new Set(resourceItems.map((item) => item.category))].sort();
    const filters = document.getElementById('resourceFilters');
    filters.replaceChildren();
    [['all', 'All'], ...categories.map((category) => [category, category])].forEach(([value, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `filter-pill${value === activeResourceCategory ? ' active' : ''}`;
      button.dataset.resourceFilter = value;
      button.setAttribute('aria-pressed', String(value === activeResourceCategory));
      button.textContent = label;
      button.addEventListener('click', () => {
        activeResourceCategory = value;
        filters.querySelectorAll('[data-resource-filter]').forEach((filter) => {
          const selected = filter === button;
          filter.classList.toggle('active', selected);
          filter.setAttribute('aria-pressed', String(selected));
        });
        renderResources();
      });
      filters.append(button);
    });
    renderResources();
    setStatus(resourceStatus, `${resourceItems.length} resource${resourceItems.length === 1 ? '' : 's'}${window.KG_IS_ADMIN ? ' including drafts' : ''}.`);
  } catch (error) {
    resourceItems = [];
    renderResources();
    setStatus(resourceStatus, error.message, 'error');
  }
}

async function loadNotificationInbox() {
  if (!notificationList || !window.KGData) return;
  setStatus(notificationStatus, 'Loading notifications…');
  try {
    notificationItems = await window.KGData.loadNotifications();
    const unread = notificationItems.filter((item) => item.unread).length;
    document.getElementById('markAllNotificationsRead').disabled = unread === 0;
    document.getElementById('notificationUnreadCount').textContent = `${unread} unread`;
    renderNotificationInbox();
    refreshMobileNavigationCounts();
    setStatus(notificationStatus, `${notificationItems.length} notification${notificationItems.length === 1 ? '' : 's'}.`);
  } catch (error) {
    notificationItems = [];
    document.getElementById('markAllNotificationsRead').disabled = true;
    renderNotificationInbox();
    document.getElementById('notificationUnreadCount').textContent = 'Unavailable';
    setStatus(notificationStatus, error.message, 'error');
  }
}

function renderNotificationInbox() {
  if (!notificationList) return;
  const visible = notificationItems.filter((item) =>
    activeNotificationFilter === 'all' || item.unread
  );
  notificationList.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'form-status';
    empty.textContent = activeNotificationFilter === 'unread'
      ? 'You are all caught up.'
      : 'No notifications yet.';
    notificationList.append(empty);
    return;
  }
  visible.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `notify-item${selectedNotificationId === item.id ? ' active' : ''}`;
    const dot = document.createElement('span');
    dot.className = `notify-dot${item.unread ? '' : ' muted'}`;
    const copy = document.createElement('span');
    copy.className = 'notify-copy';
    const topline = document.createElement('span');
    topline.className = 'notify-topline';
    const title = document.createElement('strong');
    title.textContent = item.title;
    const date = document.createElement('span');
    date.textContent = formatRelativeDate(item.created_at);
    topline.append(title, date);
    const body = document.createElement('span');
    body.textContent = item.body || '';
    copy.append(topline, body);
    button.append(dot, copy);
    button.addEventListener('click', async () => {
      selectedNotificationId = item.id;
      if (item.unread) {
        const result = await window.KGData.markNotificationsRead([item.id]);
        if (!result.success) {
          setStatus(notificationStatus, result.message, 'error');
          return;
        }
        item.unread = false;
        refreshMobileNavigationCounts();
        document.getElementById('notificationUnreadCount').textContent =
          `${notificationItems.filter((entry) => entry.unread).length} unread`;
        document.getElementById('markAllNotificationsRead').disabled =
          !notificationItems.some((entry) => entry.unread);
      }
      document.getElementById('notificationDetailType').textContent = {
        message: 'Message',
        connection: 'Network',
        event: 'Event',
        conversation: 'Conversation'
      }[item.category] || 'Notification';
      document.getElementById('notificationDetailTitle').textContent = item.title;
      document.getElementById('notificationDetailBody').textContent = item.body || 'No additional details.';
      const status = document.getElementById('notificationDetailStatus');
      status.textContent = item.unread ? 'Unread' : 'Read';
      status.className = `status-pill ${item.unread ? 'review' : 'approved'}`;
      renderNotificationInbox();
    });
    notificationList.append(button);
  });
  if (selectedNotificationId) {
    const current = notificationItems.find((item) => item.id === selectedNotificationId);
    if (current) {
      document.getElementById('notificationDetailTitle').textContent = current.title;
      document.getElementById('notificationDetailBody').textContent = current.body || 'No additional details.';
      document.getElementById('notificationDetailStatus').textContent = current.unread ? 'Unread' : 'Read';
    }
  }
}

async function exportModerationReports() {
  if (!moderationQueue || !window.KGData) return;
  try {
    const reports = await window.KGData.loadForumReports();
    if (!reports.length) {
      setStatus(moderationQueueStatus, 'There are no moderation reports to export.');
      return;
    }
    const columns = [
      ['created_at', 'Submitted at'],
      ['status', 'Status'],
      ['reason', 'Reason'],
      ['details', 'Details'],
      ['post_id', 'Forum post ID']
    ];
    const csvCell = (value) => {
      let text = value === null || value === undefined ? '' : String(value);
      if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    };
    const csv = [
      columns.map(([, label]) => csvCell(label)).join(','),
      ...reports.map((report) => columns.map(([key]) => csvCell(report[key])).join(','))
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `kg-multisector-moderation-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(moderationQueueStatus, `${reports.length} moderation report${reports.length === 1 ? '' : 's'} exported.`, 'success');
  } catch (error) {
    setStatus(moderationQueueStatus, error.message, 'error');
  }
}

async function loadMemberDirectory() {
    if (!memberDirectoryGrid || !window.KGData) return;
    memberDirectoryGrid.replaceChildren();
    setStatus(directoryStatus, 'Loading member directory…');
    try {
      const [members, relationshipData] = await Promise.all([
        window.KGData.loadMemberDirectory(),
        window.KGData.loadConnectionRequests()
      ]);
      directoryRequests = relationshipData.requests;
      directoryProfile = relationshipData.profile;
      memberDirectoryGrid.replaceChildren();
      if (!members.length) {
        setStatus(directoryStatus, 'No members have chosen to appear in the directory yet.');
        return;
      }

      const filters = document.querySelectorAll('[data-directory-filter]');
      let activeFilter = 'all';
      const renderMembers = () => {
        const query = (memberSearch?.value || '').trim().toLowerCase();
        const visibleMembers = members.filter((member) => {
          const role = (member.current_role || '').toLowerCase();
          const categoryMatches = activeFilter === 'all' ||
            (activeFilter === 'founders' && /(founder|owner|co-founder)/.test(role)) ||
            (activeFilter === 'ceos' && /(ceo|chief executive|managing director)/.test(role)) ||
            (activeFilter === 'investors' && /(investor|investment|venture|capital)/.test(role)) ||
            (activeFilter === 'professionals' && !/(founder|owner|co-founder|ceo|chief executive|managing director|investor|investment|venture|capital)/.test(role));
          const searchable = [member.full_name, member.current_role, member.company, member.location, member.bio]
            .filter(Boolean).join(' ').toLowerCase();
          return categoryMatches && searchable.includes(query);
        });

        memberDirectoryGrid.replaceChildren();
        if (!visibleMembers.length) {
          setStatus(directoryStatus, 'No directory members match those filters.');
          return;
        }
        setStatus(directoryStatus, `${visibleMembers.length} member${visibleMembers.length === 1 ? '' : 's'} shown.`);

        visibleMembers.forEach((member, index) => {
          const card = document.createElement('article');
          card.className = 'member-card';
          const top = document.createElement('div');
          top.className = 'member-top';
          const avatar = document.createElement('div');
          avatar.className = `member-avatar${index % 2 ? ' alt' : ''}`;
          setMemberAvatar(avatar, member.profile_photo_url, member.full_name);
          const badges = document.createElement('div');
          badges.className = 'member-badges';
          const verified = document.createElement('span');
          verified.className = 'verified-tag';
          verified.textContent = 'Member';
          badges.append(verified);
          top.append(avatar, badges);

          const body = document.createElement('div');
          body.className = 'member-body';
          const name = document.createElement('h3');
          name.textContent = member.full_name || 'Member';
          const role = document.createElement('p');
          role.className = 'member-role';
          role.textContent = member.current_role || 'Community member';
          const company = document.createElement('p');
          company.className = 'member-company';
          company.textContent = member.company || '';
          const facts = document.createElement('ul');
          [member.location].filter(Boolean).forEach((value) => {
            const fact = document.createElement('li');
            fact.textContent = value;
            facts.append(fact);
          });
          const bio = document.createElement('p');
          bio.className = 'bio';
          bio.textContent = member.bio || 'This member has not added a biography yet.';
          const actions = document.createElement('div');
          actions.className = 'member-actions';
          if (member.id !== directoryProfile.id) {
            const relationship = directoryRequests.find((request) =>
              (request.requester_profile_id === member.id && request.recipient_profile_id === directoryProfile.id) ||
              (request.recipient_profile_id === member.id && request.requester_profile_id === directoryProfile.id)
            );
            if (relationship?.status === 'accepted') {
              const connected = document.createElement('span');
              connected.className = 'verified-tag';
              connected.textContent = 'Connected';
              actions.append(connected);
            } else if (relationship?.status === 'requested' && relationship.recipient_profile_id === directoryProfile.id) {
              const accept = document.createElement('button');
              accept.type = 'button';
              accept.className = 'btn btn-primary small-btn';
              accept.textContent = 'Accept request';
              accept.addEventListener('click', () => updateDirectoryConnection(relationship.id, 'accepted'));
              const decline = document.createElement('button');
              decline.type = 'button';
              decline.className = 'btn btn-secondary small-btn';
              decline.textContent = 'Decline';
              decline.addEventListener('click', () => updateDirectoryConnection(relationship.id, 'declined'));
              actions.append(accept, decline);
            } else if (relationship?.status === 'requested') {
              const sent = document.createElement('span');
              sent.textContent = 'Request sent';
              const withdraw = document.createElement('button');
              withdraw.type = 'button';
              withdraw.className = 'btn btn-secondary small-btn';
              withdraw.textContent = 'Withdraw';
              withdraw.addEventListener('click', () => updateDirectoryConnection(relationship.id, 'withdrawn'));
              actions.append(sent, withdraw);
            } else {
              const connect = document.createElement('button');
              connect.type = 'button';
              connect.className = 'btn btn-secondary small-btn';
              connect.textContent = 'Connect';
              connect.addEventListener('click', async () => {
                connect.disabled = true;
                try {
                  const result = await window.KGData.sendConnectionRequest(member.id);
                  if (!result.success) throw new Error(result.message);
                  await refreshMemberDirectory?.();
                  setStatus(directoryStatus, result.message, 'success');
                } catch (error) {
                  setStatus(directoryStatus, error.message, 'error');
                  connect.disabled = false;
                }
              });
              actions.append(connect);
            }

            if (member.allow_dm) {
              const message = document.createElement('a');
              message.className = 'btn btn-primary small-btn';
              message.href = `messages.html?to=${encodeURIComponent(member.id)}`;
              message.textContent = 'Message';
              actions.append(message);
            }
          }
          if (member.linkedin) {
            const link = document.createElement('a');
            link.className = 'btn btn-primary';
            link.href = member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'View LinkedIn';
            actions.append(link);
          }
          body.append(name, role, company, facts, bio, actions);
          card.append(top, body);
          memberDirectoryGrid.append(card);
        });
      };

      filters.forEach((button) => {
        button.addEventListener('click', () => {
          activeFilter = button.dataset.directoryFilter || 'all';
          filters.forEach((item) => {
            const selected = item === button;
            item.classList.toggle('active', selected);
            item.setAttribute('aria-pressed', String(selected));
          });
          renderMembers();
        });
      });
      memberSearch?.addEventListener('input', renderMembers);
      refreshMemberDirectory = async () => {
        const [updatedMembers, updatedRelationships] = await Promise.all([
          window.KGData.loadMemberDirectory(),
          window.KGData.loadConnectionRequests()
        ]);
        members.splice(0, members.length, ...updatedMembers);
        directoryRequests = updatedRelationships.requests;
        directoryProfile = updatedRelationships.profile;
        renderMembers();
      };
      renderMembers();
    } catch (error) {
      memberDirectoryGrid.replaceChildren();
      setStatus(directoryStatus, error.message, 'error');
    }
  }

  async function updateDirectoryConnection(requestId, status) {
    try {
      const result = await window.KGData.updateConnectionRequest(requestId, status);
      if (!result.success) throw new Error(result.message);
      await refreshMemberDirectory?.();
      setStatus(directoryStatus, result.message, 'success');
    } catch (error) {
      setStatus(directoryStatus, error.message, 'error');
    }
  }

  if (yearNode) {
    yearNode.textContent = new Date().getFullYear();
  }
  document.addEventListener('kg:auth-ready', () => {
    refreshMobileNavigationCounts();
    if (!memberNavigationSubscription && window.KGData?.subscribeToMemberNavUpdates) {
      window.KGData.subscribeToMemberNavUpdates(
        refreshMobileNavigationCounts,
        (error) => console.error('Member navigation updates could not be subscribed:', error)
      ).then((unsubscribe) => {
        memberNavigationSubscription = unsubscribe;
      }).catch((error) => {
        console.error('Member navigation updates could not be subscribed:', error);
      });
    }
    loadAdminApplications();
    loadMemberDirectory();
    loadEvents();
    loadConversationListings();
    loadCommunityForum();
    loadModerationQueue();
    loadMessages();
    loadResourceLibrary();
    loadNotificationInbox();
    loadAdminDashboardStats();
    loadMemberNetwork();
    loadMemberDashboard();
    loadSubscriptionPage();
  });
  async function refreshMobileNavigationCounts() {
    if (!mobileNavigation || !window.KGData?.loadMemberNavCounts) return;
    window.clearTimeout(navigationCountRefresh);
    navigationCountRefresh = window.setTimeout(async () => {
      try {
        const counts = await window.KGData.loadMemberNavCounts();
        Object.entries(counts).forEach(([key, count]) => {
          const badge = mobileNavigation.querySelector(`[data-nav-badge="${key}"]`);
          if (!badge) return;
          const value = Number(count) || 0;
          badge.textContent = value > 99 ? '99+' : String(value);
          badge.hidden = value === 0;
          const link = badge.closest('a');
          const countDescription = {
            network: 'pending connection requests',
            messages: 'unread messages',
            events: 'new event or conversation notifications'
          }[key];
          link?.setAttribute('aria-label', `${link.dataset.navLabel}${value ? `, ${value} ${countDescription}` : ''}`);
        });
      } catch (error) {
        console.error('Member navigation counts could not be loaded:', error);
      }
    }, 120);
  }
  window.addEventListener('focus', refreshMobileNavigationCounts);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) refreshMobileNavigationCounts();
  });

  document.querySelectorAll('[data-forum-topic]').forEach((item) => {
    const activate = () => {
      activeForumTopic = item.dataset.forumTopic || 'all';
      document.querySelectorAll('[data-forum-topic]').forEach((topic) => {
        const selected = topic === item;
        topic.classList.toggle('active', selected);
        topic.setAttribute('aria-pressed', String(selected));
      });
      renderForumPosts();
    };
    item.addEventListener('click', activate);
    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activate();
      }
    });
  });

  document.querySelectorAll('[data-report-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeReportFilter = button.dataset.reportFilter || 'all';
      document.querySelectorAll('[data-report-filter]').forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle('active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      renderModerationQueue();
    });
  });

  document.querySelectorAll('[data-conversation-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeConversationTopic = button.dataset.conversationFilter || 'all';
      document.querySelectorAll('[data-conversation-filter]').forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle('active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      loadConversationListings();
    });
  });

  document.querySelectorAll('[data-network-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeNetworkFilter = button.dataset.networkFilter || 'all';
      document.querySelectorAll('[data-network-filter]').forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle('active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      renderMemberNetwork();
    });
  });

  document.querySelectorAll('[data-notification-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeNotificationFilter = button.dataset.notificationFilter || 'all';
      document.querySelectorAll('[data-notification-filter]').forEach((filter) => {
        const selected = filter === button;
        filter.classList.toggle('active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      renderNotificationInbox();
    });
  });

  document.getElementById('markAllNotificationsRead')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const result = await window.KGData.markNotificationsRead();
      if (!result.success) throw new Error(result.message);
      await loadNotificationInbox();
      refreshMobileNavigationCounts();
      setStatus(notificationStatus, result.message, 'success');
    } catch (error) {
      setStatus(notificationStatus, error.message, 'error');
    } finally {
      button.disabled = !notificationItems.some((item) => item.unread);
    }
  });

  document.getElementById('messageSearch')?.addEventListener('input', renderMessages);
  const emojiToggleButton = document.getElementById('emojiToggleButton');
  const emojiPicker = document.getElementById('emojiPicker');
  emojiToggleButton?.addEventListener('click', () => {
    emojiPicker.hidden = !emojiPicker.hidden;
    emojiToggleButton.setAttribute('aria-expanded', String(!emojiPicker.hidden));
  });
  emojiPicker?.addEventListener('click', (event) => {
    const emojiButton = event.target.closest('[data-message-emoji]');
    if (!emojiButton || !messageComposer) return;
    const input = messageComposer.elements.namedItem('message');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.setRangeText(emojiButton.dataset.messageEmoji, start, end, 'end');
    input.focus();
    emojiPicker.hidden = true;
    emojiToggleButton.setAttribute('aria-expanded', 'false');
  });

  document.getElementById('startAudioCallButton')?.addEventListener('click', () => startDirectCall('audio'));
  document.getElementById('startVideoCallButton')?.addEventListener('click', () => startDirectCall('video'));
  document.getElementById('acceptCallButton')?.addEventListener('click', async (event) => {
    const call = activeCall;
    if (!call || call.role !== 'callee') return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus(messageStatus, 'Calls need a supported browser and a secure HTTPS connection.', 'error');
      return;
    }
    try {
      event.currentTarget.disabled = true;
      document.getElementById('declineCallButton').disabled = true;
      callInboxStatus.textContent = 'Allow microphone access to join…';
      call.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.mode === 'video'
      });
      createDirectCallPeer(call);
      incomingCall = null;
      window.clearTimeout(call.timeout);
      setCallPanelState(`Call with ${call.partnerName}`, 'Connecting…', { active: true });
      await call.signaling.send({ type: 'accepted', callId: call.id });
    } catch (error) {
      await endDirectCall(true, error.message, 'error');
    }
  });
  document.getElementById('declineCallButton')?.addEventListener('click', async () => {
    const call = activeCall;
    if (!call) return;
    try {
      await call.signaling?.send({ type: 'declined', callId: call.id });
    } catch (error) {
      setStatus(messageStatus, error.message, 'error');
    }
    await endDirectCall(false, 'Call declined.');
  });
  document.getElementById('hangupCallButton')?.addEventListener('click', () => {
    void endDirectCall(true, 'Call ended.');
  });
  document.getElementById('muteCallButton')?.addEventListener('click', (event) => {
    const tracks = activeCall?.localStream?.getAudioTracks() || [];
    const muted = tracks.some((track) => track.enabled);
    tracks.forEach((track) => { track.enabled = !muted; });
    event.currentTarget.textContent = muted ? 'Unmute microphone' : 'Mute microphone';
  });
  document.getElementById('toggleCallCameraButton')?.addEventListener('click', (event) => {
    const tracks = activeCall?.localStream?.getVideoTracks() || [];
    const enabled = tracks.some((track) => track.enabled);
    tracks.forEach((track) => { track.enabled = !enabled; });
    event.currentTarget.textContent = enabled ? 'Turn camera on' : 'Turn camera off';
  });
  window.addEventListener('pagehide', () => {
    activeCall?.peer?.close();
    activeCall?.localStream?.getTracks().forEach((track) => track.stop());
    if (activeCall?.signaling) void activeCall.signaling.close();
    if (callInboxChannel) void callInboxChannel.close();
    if (voiceRecorder?.state === 'recording') voiceRecorder.stop();
    voiceRecordingStream?.getTracks().forEach((track) => track.stop());
  });
  document.getElementById('newMessageButton')?.addEventListener('click', () => {
    newMessageControls.hidden = !newMessageControls.hidden;
    if (!newMessageControls.hidden) newMessageRecipient.focus();
  });
  document.getElementById('startMessageButton')?.addEventListener('click', () => {
    const recipientId = newMessageRecipient.value;
    if (!recipientId) {
      setStatus(document.getElementById('newMessageStatus'), 'Choose a member first.', 'error');
      return;
    }
    newMessageControls.hidden = true;
    newMessageRecipient.value = '';
    setStatus(document.getElementById('newMessageStatus'), '');
    openMessageConversation(recipientId);
  });

  if (messageComposer) {
    const mediaInput = messageComposer.elements.namedItem('mediaFile');
    const attachmentName = document.getElementById('messageAttachmentName');
    mediaInput.addEventListener('change', () => {
      recordedVoiceFile = null;
      attachmentName.textContent = mediaInput.files[0]?.name || 'Attach';
    });
    document.getElementById('recordVoiceMessageButton').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      if (voiceRecorder?.state === 'recording') {
        voiceRecorder.stop();
        return;
      }
      if (!activeMessagePartnerId) {
        setStatus(messageStatus, 'Choose a conversation before recording a voice message.', 'error');
        return;
      }
      if (activeCall) {
        setStatus(messageStatus, 'End the call before recording a voice message.', 'error');
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setStatus(messageStatus, 'Voice messages are not supported by this browser.', 'error');
        return;
      }
      try {
        mediaInput.value = '';
        recordedVoiceFile = null;
        attachmentName.textContent = 'Attach';
        voiceRecordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = ['audio/webm;codecs=opus', 'audio/webm']
          .find((type) => MediaRecorder.isTypeSupported(type));
        if (!mimeType) throw new Error('This browser cannot record a supported voice-message format.');
        voiceRecordingParts = [];
        voiceRecorder = new MediaRecorder(voiceRecordingStream, { mimeType });
        voiceRecorder.addEventListener('dataavailable', (recordingEvent) => {
          if (recordingEvent.data.size) voiceRecordingParts.push(recordingEvent.data);
        });
        voiceRecorder.addEventListener('stop', () => {
          const recording = new Blob(voiceRecordingParts, { type: 'audio/webm' });
          recordedVoiceFile = recording.size
            ? new File([recording], 'voice-note.webm', { type: 'audio/webm' })
            : null;
          voiceRecordingStream?.getTracks().forEach((track) => track.stop());
          voiceRecordingStream = null;
          voiceRecorder = null;
          button.textContent = '🎙️';
          button.setAttribute('aria-label', 'Record a voice message');
          document.getElementById('voiceRecordingStatus').textContent = recordedVoiceFile
            ? 'Voice note ready. Press Send to send it.'
            : 'No audio was recorded.';
          attachmentName.textContent = recordedVoiceFile ? 'Voice note ready' : 'Attach';
          if (recordedVoiceFile) setStatus(messageStatus, 'Voice note ready to send.');
        }, { once: true });
        voiceRecorder.start();
        button.textContent = '■';
        button.setAttribute('aria-label', 'Stop recording');
        document.getElementById('voiceRecordingStatus').textContent = 'Recording…';
        setStatus(messageStatus, '');
      } catch (error) {
        voiceRecordingStream?.getTracks().forEach((track) => track.stop());
        voiceRecordingStream = null;
        voiceRecorder = null;
        button.textContent = '🎙️';
        button.setAttribute('aria-label', 'Record a voice message');
        setStatus(messageStatus, error.message, 'error');
      }
    });
    messageComposer.addEventListener('submit', async (event) => {
      event.preventDefault();
      const messageInput = messageComposer.elements.namedItem('message');
      if (voiceRecorder?.state === 'recording') {
        setStatus(messageStatus, 'Stop the voice recording before sending.', 'error');
        return;
      }
      if (!activeMessagePartnerId) {
        setStatus(messageStatus, 'Choose a conversation or start one before sending.', 'error');
        return;
      }
      const sendButton = document.getElementById('sendMessageButton');
      const mediaInput = messageComposer.elements.namedItem('mediaFile');
      sendButton.disabled = true;
      try {
        const result = await window.KGData.sendDirectMessage(activeMessagePartnerId, {
          content: messageInput.value,
          mediaFile: mediaInput.files[0] || recordedVoiceFile
        });
        if (!result.success) throw new Error(result.message);
        messageInput.value = '';
        mediaInput.value = '';
        recordedVoiceFile = null;
        document.getElementById('voiceRecordingStatus').textContent = '';
        attachmentName.textContent = 'Attach';
        await loadMessages();
        setStatus(messageStatus, result.message, 'success');
      } catch (error) {
        setStatus(messageStatus, error.message, 'error');
      } finally {
        renderMessages();
      }
    });
  }

  if (resourceAdminForm) {
    resourceAdminForm.addEventListener('reset', () => {
      setTimeout(() => {
        resourceAdminForm.elements.namedItem('id').value = '';
        resourceFormHeading.textContent = 'Add a resource';
        resourceFormSubmit.textContent = 'Add resource';
      }, 0);
    });
    resourceAdminForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = readForm(resourceAdminForm);
      payload.published = resourceAdminForm.elements.namedItem('published').checked;
      resourceFormSubmit.disabled = true;
      setStatus(resourceAdminStatus, 'Saving resource…');
      try {
        const result = await window.KGData.saveResource(payload);
        if (!result.success) throw new Error(result.message);
        resetResourceForm();
        await loadResourceLibrary();
        setStatus(resourceAdminStatus, result.message, 'success');
      } catch (error) {
        setStatus(resourceAdminStatus, error.message, 'error');
      } finally {
        resourceFormSubmit.disabled = false;
      }
    });
  }

  if (eventAdminForm) {
    eventAdminForm.addEventListener('reset', () => {
      setTimeout(() => {
        eventAdminForm.elements.namedItem('id').value = '';
        eventFormHeading.textContent = 'Create an event';
        eventFormSubmit.textContent = 'Create event';
        const mediaHint = document.getElementById('eventMediaHint');
        if (mediaHint) mediaHint.textContent = '';
      }, 0);
    });
    eventAdminForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const payload = readForm(eventAdminForm);
      const submit = eventFormSubmit;
      submit.disabled = true;
      setStatus(eventAdminStatus, 'Saving event…');
      try {
        const result = await window.KGData.saveEvent(payload);
        if (!result.success) throw new Error(result.message);
        resetEventForm();
        setStatus(eventAdminStatus, result.message, 'success');
        await loadEvents();
      } catch (error) {
        setStatus(eventAdminStatus, error.message, 'error');
      } finally {
        submit.disabled = false;
      }
    });
  }

  document.querySelectorAll('[data-action-export="members"]').forEach((button) => {
    button.addEventListener('click', exportAdminMembers);
  });
  document.querySelectorAll('[data-action-export="reports"]').forEach((button) => {
    button.addEventListener('click', exportModerationReports);
  });

  if (menuToggle && header) {
    menuToggle.addEventListener('click', function () {
      const isOpen = header.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  if (form && formStatus) {
    const applicationPhotoInput = form.elements.namedItem('profilePhoto');
    const applicationPhotoPreview = document.getElementById('applicationPhotoPreview');
    applicationPhotoInput?.addEventListener('change', () => {
      const selectedPhoto = applicationPhotoInput.files?.[0];
      if (!selectedPhoto || !applicationPhotoPreview) return;
      if (!selectedPhoto.type.startsWith('image/') || selectedPhoto.size > 5 * 1024 * 1024) {
        applicationPhotoInput.value = '';
        setStatus(formStatus, 'Choose a JPG, PNG, WebP, or GIF profile photo no larger than 5 MB.', 'error');
        return;
      }
      applicationPhotoPreview.src = URL.createObjectURL(selectedPhoto);
      applicationPhotoPreview.hidden = false;
    });
    form.addEventListener('reset', () => {
      if (applicationPhotoPreview) {
        applicationPhotoPreview.removeAttribute('src');
        applicationPhotoPreview.hidden = true;
      }
    });
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const payload = readForm(form);
      const service = window.KGData && typeof window.KGData.submitApplication === 'function'
        ? window.KGData
        : null;

      if (!service) {
        setStatus(formStatus, 'Application service unavailable. Please try again after Supabase is configured.', 'error');
        return;
      }

      try {
        const result = await service.submitApplication(payload);
        setStatus(formStatus, result.message || 'Application submitted.', result.success ? 'success' : 'error');
        if (result.success) {
          form.reset();
          if (applicationPhotoPreview) {
            applicationPhotoPreview.removeAttribute('src');
            applicationPhotoPreview.hidden = true;
          }
        }
      } catch (error) {
        setStatus(formStatus, `Application could not be submitted: ${error.message}`, 'error');
      }
    });
  }

  if (loginForm && loginStatus) {
    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const payload = readForm(loginForm);
      const service = window.KGData && typeof window.KGData.signIn === 'function'
        ? window.KGData
        : null;

      if (!service) {
        setStatus(loginStatus, 'Sign-in service unavailable. Configure Supabase before signing in.', 'error');
        return;
      }

      try {
        const result = await service.signIn(payload);
        setStatus(loginStatus, result.message || 'Login successful.', result.success ? 'success' : 'error');
        if (result.success) {
          loginForm.reset();
          const nextPage = result.role === 'admin' ? 'admin-dashboard.html' : 'member-dashboard.html';
          setTimeout(() => window.location.replace(nextPage), 700);
        }
      } catch (error) {
        setStatus(loginStatus, `Sign-in failed: ${error.message}`, 'error');
      }
    });
  }

  const accountSetupForm = document.getElementById('accountSetupForm');
  const accountSetupStatus = document.getElementById('accountSetupStatus');
  const showAccountSetup = () => {
    if (!loginForm || !accountSetupForm || !passwordRecoveryForm) return;
    loginForm.hidden = true;
    passwordRecoveryForm.hidden = true;
    accountSetupForm.hidden = false;
  };
  document.getElementById('showAccountSetup')?.addEventListener('click', showAccountSetup);
  document.getElementById('returnToLogin')?.addEventListener('click', () => {
    if (!loginForm || !accountSetupForm) return;
    accountSetupForm.hidden = true;
    loginForm.hidden = false;
    setStatus(accountSetupStatus, '');
  });
  accountSetupForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm(accountSetupForm);
    if (values.password !== values.confirmPassword) {
      setStatus(accountSetupStatus, 'The passwords do not match.', 'error');
      return;
    }
    const submit = document.getElementById('accountSetupSubmit');
    submit.disabled = true;
    setStatus(accountSetupStatus, 'Checking your approved application and creating your account…');
    try {
      const result = await window.KGData.redeemApprovedApplicantWhatsAppCode({
        email: values.email,
        code: values.code,
        password: values.password
      });
      if (!result.success) throw new Error(result.message);
      accountSetupForm.reset();
      if (!result.role) {
        accountSetupForm.hidden = true;
        loginForm.hidden = false;
        setStatus(loginStatus, result.message, 'success');
      } else {
        setStatus(accountSetupStatus, result.message, 'success');
      }
      if (result.role) {
        const nextPage = result.role === 'admin' ? 'admin-dashboard.html' : 'member-dashboard.html';
        setTimeout(() => window.location.replace(nextPage), 900);
      }
    } catch (error) {
      setStatus(accountSetupStatus, error.message, 'error');
    } finally {
      submit.disabled = false;
    }
  });

  const recoveryRequested = new URLSearchParams(window.location.search).has('password-recovery');
  const accountSetupRequested = new URLSearchParams(window.location.search).has('account-setup');
  const showPasswordRecovery = () => {
    if (!loginForm || !passwordRecoveryForm) return;
    loginForm.hidden = true;
    passwordRecoveryForm.hidden = false;
  };
  document.getElementById('forgotPasswordButton')?.addEventListener('click', async () => {
    const email = loginForm?.elements.namedItem('email')?.value || '';
    const button = document.getElementById('forgotPasswordButton');
    button.disabled = true;
    try {
      const result = await window.KGData.requestPasswordReset(email);
      setStatus(loginStatus, result.message, result.success ? 'success' : 'error');
    } catch (error) {
      setStatus(loginStatus, `Password reset could not be requested: ${error.message}`, 'error');
    } finally {
      button.disabled = false;
    }
  });

  if (passwordRecoveryForm && passwordRecoveryStatus && window.KGData?.client) {
    const revealIfRecoverySession = async () => {
      if (!recoveryRequested && !accountSetupRequested) return;
      const { data, error } = await window.KGData.client.auth.getSession();
      if (error) {
        setStatus(passwordRecoveryStatus, `Account setup session could not be checked: ${error.message}`, 'error');
      } else if (data.session) {
        showPasswordRecovery();
        if (accountSetupRequested) {
          passwordRecoveryForm.querySelector('h2').textContent = 'Set your member password';
          passwordRecoveryForm.querySelector('p:not(.section-kicker)').textContent = 'Choose a password to activate your approved member account.';
        }
      }
    };
    window.KGData.client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || (accountSetupRequested && event === 'SIGNED_IN')) {
        showPasswordRecovery();
        if (accountSetupRequested) {
          passwordRecoveryForm.querySelector('h2').textContent = 'Set your member password';
          passwordRecoveryForm.querySelector('p:not(.section-kicker)').textContent = 'Choose a password to activate your approved member account.';
        }
      }
    });
    revealIfRecoverySession();
    passwordRecoveryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = readForm(passwordRecoveryForm);
      if (values.newPassword !== values.confirmPassword) {
        setStatus(passwordRecoveryStatus, 'The passwords do not match.', 'error');
        return;
      }
      const submit = passwordRecoveryForm.querySelector('[type="submit"]');
      submit.disabled = true;
      try {
        const result = await window.KGData.updateAccountPassword(values.newPassword);
        setStatus(passwordRecoveryStatus, result.message, result.success ? 'success' : 'error');
        if (result.success) {
          passwordRecoveryForm.reset();
          if (accountSetupRequested) {
            setStatus(passwordRecoveryStatus, 'Password saved. Taking you to your member dashboard…', 'success');
            setTimeout(() => window.location.replace('member-dashboard.html'), 900);
          }
        }
      } catch (error) {
        setStatus(passwordRecoveryStatus, `Password could not be updated: ${error.message}`, 'error');
      } finally {
        submit.disabled = false;
      }
    });
  }

  if (settingsForm && settingsStatus) {
    const profilePhotoInput = settingsForm.elements.namedItem('profilePhoto');
    const profilePhotoPreview = document.getElementById('profilePhotoPreview');
    profilePhotoInput?.addEventListener('change', () => {
      const selectedPhoto = profilePhotoInput.files?.[0];
      if (!selectedPhoto || !profilePhotoPreview) return;
      if (selectedPhoto.size > 5 * 1024 * 1024) {
        profilePhotoInput.value = '';
        setStatus(settingsStatus, 'Profile photos must be 5 MB or smaller.', 'error');
        return;
      }
      if (!selectedPhoto.type.startsWith('image/')) {
        profilePhotoInput.value = '';
        setStatus(settingsStatus, 'Choose a supported image file for your profile photo.', 'error');
        return;
      }
      profilePhotoPreview.src = URL.createObjectURL(selectedPhoto);
      profilePhotoPreview.hidden = false;
    });
    settingsForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const payload = readForm(settingsForm);
      const service = window.KGData && typeof window.KGData.syncProfile === 'function'
        ? window.KGData
        : null;

      if (!service) {
        setStatus(settingsStatus, 'Settings service unavailable. Configure Supabase before saving.', 'error');
        return;
      }

      try {
        const result = await service.syncProfile({
          fullName: payload.fullName,
          email: payload.email,
          currentRole: payload.currentRole,
          company: payload.company,
          location: payload.location,
          linkedin: payload.linkedin,
          bio: payload.bio,
          profilePhoto: payload.profilePhoto,
          weeklyDigest: payload.weeklyDigest === 'on',
          eventReminders: payload.eventReminders === 'on',
          mentionsReplies: payload.mentionsReplies === 'on',
          newForumActivity: payload.newForumActivity === 'on',
          showProfile: payload.showProfile === 'on',
          allowDm: payload.allowDm === 'on',
          showNetworkSuggestions: payload.showNetworkSuggestions === 'on'
        });
        const selectedPhoto = settingsForm.elements.namedItem('profilePhoto')?.files?.[0];
        if (result.success && selectedPhoto && profilePhotoPreview) {
          const previewUrl = profilePhotoPreview.src;
          document.querySelectorAll('[data-profile-initials]').forEach((element) => {
            const image = document.createElement('img');
            image.className = 'member-photo-avatar';
            image.src = previewUrl;
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            element.replaceChildren(image);
          });
        }
        setStatus(settingsStatus, result.message || 'Settings saved.', result.success ? 'success' : 'error');
      } catch (error) {
        setStatus(settingsStatus, `Settings could not be saved: ${error.message}`, 'error');
      }
    });
  }

  const subscriptionPaymentForm = document.getElementById('subscriptionPaymentForm');
  const subscriptionPaymentStatus = document.getElementById('subscriptionPaymentStatus');
  subscriptionPaymentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = document.getElementById('subscriptionSubmit');
    submit.disabled = true;
    setStatus(subscriptionPaymentStatus, 'Submitting transaction details…');
    try {
      const values = readForm(subscriptionPaymentForm);
      const result = await window.KGData.submitSubscriptionPayment({
        phone: values.phone,
        reference: values.reference
      });
      if (!result.success) throw new Error(result.message);
      subscriptionPaymentForm.elements.namedItem('reference').value = '';
      setStatus(subscriptionPaymentStatus, result.message, 'success');
      await loadSubscriptionPage();
    } catch (error) {
      setStatus(subscriptionPaymentStatus, error.message, 'error');
    } finally {
      submit.disabled = false;
    }
  });

  if (forumForm && forumStatus && forumFeed) {
    const textInput = forumForm.querySelector('textarea[name="discussion"]');
    const topicInput = forumForm.elements.namedItem('topic');
    const mediaInput = forumForm.elements.namedItem('mediaFile');

    forumForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const content = (textInput && textInput.value || '').trim();
      const topicName = topicInput?.value || 'General';
      const mediaFile = mediaInput?.files?.[0] || null;
      if (!content && !mediaFile) {
        setStatus(forumStatus, 'Write a discussion or attach a file before posting.', 'error');
        return;
      }

      const service = window.KGData && typeof window.KGData.createForumPost === 'function' ? window.KGData : null;
      if (!service) {
        setStatus(forumStatus, 'Forum service unavailable. Configure Supabase before posting.', 'error');
        return;
      }

      let result;
      try {
        result = await service.createForumPost({ topic: topicName, content, mediaFile });
      } catch (error) {
        setStatus(forumStatus, `Discussion could not be posted: ${error.message}`, 'error');
        return;
      }

      if (result.success) {
        forumForm.reset();
        await loadCommunityForum();
      }

      setStatus(forumStatus, result.message || 'Discussion posted.', result.success ? 'success' : 'error');
    });
  }
});