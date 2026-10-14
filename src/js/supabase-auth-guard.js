(function () {
  function showAccessError(message) {
    const notice = document.createElement('section');
    notice.className = 'auth-block-notice';
    notice.setAttribute('role', 'alert');
    notice.innerHTML = `<h1>Member access unavailable</h1><p></p><a href="login.html">Return to sign in</a>`;
    notice.querySelector('p').textContent = message;
    document.body.appendChild(notice);
  }

  document.addEventListener('DOMContentLoaded', async function () {
    const requiredRole = document.body.dataset.authRole;
    if (!requiredRole) return;

    if (!window.KGData || !window.KGData.isConfigured || !window.KGData.client) {
      showAccessError('Configure the Supabase project URL and public anon key to access member pages.');
      return;
    }

    const result = await window.KGData.getCurrentProfile();
    if (result.error) {
      showAccessError(`Your access could not be verified: ${result.error}`);
      return;
    }
    if (!result.profile) {
      window.location.replace('login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop()));
      return;
    }
    if (requiredRole === 'admin' && result.profile.role !== 'admin') {
      showAccessError('This page is restricted to KG Multisector administrators.');
      return;
    }

    document.documentElement.classList.remove('auth-pending');
    window.KG_CURRENT_PROFILE = result.profile;
    window.KG_IS_ADMIN = result.profile.role === 'admin';
    if (window.KG_IS_ADMIN) {
      document.querySelectorAll('[data-admin-only]').forEach((element) => {
        element.hidden = false;
      });
      const navActions = document.querySelector('.nav-actions');
      if (navActions && !navActions.querySelector('[data-admin-dashboard-link]')) {
        const link = document.createElement('a');
        link.href = 'admin-dashboard.html';
        link.className = 'btn btn-ghost small-btn';
        link.textContent = 'Admin';
        link.setAttribute('data-admin-dashboard-link', '');
        navActions.prepend(link);
      }
    }
    document.querySelectorAll('[data-profile-name]').forEach((element) => {
      element.textContent = result.profile.full_name || 'Member';
    });
    document.querySelectorAll('[data-profile-company]').forEach((element) => {
      element.textContent = result.profile.company || 'Company not added yet';
    });
    document.querySelectorAll('[data-profile-role]').forEach((element) => {
      element.textContent = result.profile.current_role || 'Member';
    });
    document.querySelectorAll('[data-profile-location]').forEach((element) => {
      element.textContent = result.profile.location || 'Not added yet';
    });
    document.querySelectorAll('[data-profile-bio]').forEach((element) => {
      element.textContent = result.profile.bio || 'Add a short introduction in your profile settings.';
    });

    const initials = (result.profile.full_name || 'M')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
    document.querySelectorAll('[data-profile-initials]').forEach((element) => {
      if (result.profile.profile_photo_url) {
        const image = document.createElement('img');
        image.className = 'member-photo-avatar';
        image.src = result.profile.profile_photo_url;
        image.alt = '';
        image.setAttribute('aria-hidden', 'true');
        element.replaceChildren(image);
      } else {
        element.textContent = initials;
      }
    });

    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      const photoPreview = document.getElementById('profilePhotoPreview');
      if (photoPreview && result.profile.profile_photo_url) {
        photoPreview.src = result.profile.profile_photo_url;
        photoPreview.hidden = false;
      }
      const fieldValues = {
        fullName: result.profile.full_name,
        email: result.profile.email,
        currentRole: result.profile.current_role,
        company: result.profile.company,
        location: result.profile.location,
        whatsappContact: result.profile.whatsapp_contact,
        bio: result.profile.bio
      };
      Object.entries(fieldValues).forEach(([name, value]) => {
        const field = settingsForm.elements.namedItem(name);
        if (field && value !== null && value !== undefined) field.value = value;
      });
      const preferences = {
        weeklyDigest: result.profile.weekly_digest,
        eventReminders: result.profile.event_reminders,
        mentionsReplies: result.profile.mentions_replies,
        newForumActivity: result.profile.new_forum_activity,
        showProfile: result.profile.show_profile,
        showWhatsApp: result.profile.show_whatsapp,
        allowDm: result.profile.allow_dm,
        showNetworkSuggestions: result.profile.show_network_suggestions
      };
      Object.entries(preferences).forEach(([name, checked]) => {
        const field = settingsForm.elements.namedItem(name);
        if (field) field.checked = Boolean(checked);
      });
    }

    const navActions = document.querySelector('.nav-actions');
    if (navActions && !navActions.querySelector('[data-sign-out]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-ghost small-btn';
      button.textContent = 'Sign out';
      button.setAttribute('data-sign-out', '');
      navActions.appendChild(button);
    }

    document.querySelectorAll('[data-sign-out]').forEach((button) => {
      button.addEventListener('click', async function () {
        button.disabled = true;
        const signOut = await window.KGData.signOut();
        if (!signOut.success) {
          button.disabled = false;
          showAccessError(`Sign out failed: ${signOut.message}`);
          return;
        }
        window.location.replace('login.html');
      });
    });
    document.dispatchEvent(new CustomEvent('kg:auth-ready', { detail: result.profile }));
  });
})();
