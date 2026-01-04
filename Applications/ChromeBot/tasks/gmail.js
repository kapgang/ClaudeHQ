/**
 * Gmail Task - Send Email
 *
 * Automates logging into Gmail and sending an email
 * Includes retry logic for error handling
 */

const MAX_RETRIES = 3;
const RETRY_DELAY = 3000;

// Helper function for delays
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry wrapper function
async function withRetry(fn, retries = MAX_RETRIES, context = '') {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`[Gmail] ${context} - Attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        console.log(`[Gmail] Waiting ${RETRY_DELAY / 1000}s before retry...`);
        await wait(RETRY_DELAY);
      }
    }
  }
  throw lastError;
}

// Login to Google account
async function loginToGoogle(page, email, password) {
  console.log('[Gmail] Starting Google login...');

  // Navigate to Gmail
  await page.goto('https://mail.google.com/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await wait(2000);

  // Check if already logged in
  const currentUrl = page.url();
  if (currentUrl.includes('mail.google.com/mail')) {
    console.log('[Gmail] Already logged in!');
    return true;
  }

  // Should be on login page
  if (!currentUrl.includes('accounts.google.com')) {
    console.log('[Gmail] Unexpected page, navigating to accounts...');
    await page.goto('https://accounts.google.com/signin', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await wait(2000);
  }

  console.log('[Gmail] On login page, entering email...');

  // Enter email
  await withRetry(async () => {
    const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await emailInput.click({ clickCount: 3 });
    await emailInput.type(email, { delay: 50 });
  }, 3, 'Enter email');

  await wait(1000);

  // Click Next button
  await withRetry(async () => {
    const nextButton = await page.$('#identifierNext') ||
                       await page.$('button[jsname="LgbsSe"]') ||
                       await page.$('div[id="identifierNext"]');
    if (nextButton) {
      await nextButton.click();
    } else {
      await page.keyboard.press('Enter');
    }
  }, 3, 'Click next after email');

  await wait(3000);

  // Check for password field
  console.log('[Gmail] Entering password...');

  await withRetry(async () => {
    const passwordInput = await page.waitForSelector('input[type="password"]', {
      visible: true,
      timeout: 15000
    });
    await passwordInput.click({ clickCount: 3 });
    await passwordInput.type(password, { delay: 50 });
  }, 3, 'Enter password');

  await wait(1000);

  // Click password Next button
  await withRetry(async () => {
    const passwordNext = await page.$('#passwordNext') ||
                         await page.$('button[jsname="LgbsSe"]') ||
                         await page.$('div[id="passwordNext"]');
    if (passwordNext) {
      await passwordNext.click();
    } else {
      await page.keyboard.press('Enter');
    }
  }, 3, 'Click next after password');

  console.log('[Gmail] Waiting for login to complete...');
  await wait(5000);

  // Check if login was successful
  const postLoginUrl = page.url();

  // Handle potential security challenges
  if (postLoginUrl.includes('challenge') || postLoginUrl.includes('signin/v2')) {
    console.log('[Gmail] Security challenge detected - may need manual intervention');
    // Wait longer for user to handle security challenge
    await wait(30000);
  }

  // Verify we made it to Gmail
  const finalUrl = page.url();
  if (finalUrl.includes('mail.google.com')) {
    console.log('[Gmail] Login successful!');
    return true;
  }

  // Try navigating to Gmail directly
  console.log('[Gmail] Attempting to navigate to Gmail...');
  await page.goto('https://mail.google.com/', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });
  await wait(3000);

  if (page.url().includes('mail.google.com/mail')) {
    console.log('[Gmail] Login successful!');
    return true;
  }

  throw new Error('Failed to login - still not on Gmail inbox');
}

// Compose and send email
async function composeAndSend(page, to, subject, body) {
  console.log('[Gmail] Composing email...');

  // Wait for inbox to fully load
  await wait(3000);

  // Click Compose button with retry
  await withRetry(async () => {
    const composeClicked = await page.evaluate(() => {
      // Try multiple selectors for compose button
      const selectors = [
        '.T-I.T-I-KE.L3',
        'div[gh="cm"]',
        '.z0 > div',
        '[role="button"][tabindex="0"]'
      ];

      for (const sel of selectors) {
        const btn = document.querySelector(sel);
        if (btn && btn.textContent.toLowerCase().includes('compose')) {
          btn.click();
          return true;
        }
      }

      // Fallback: find by text
      const allButtons = document.querySelectorAll('[role="button"]');
      for (const btn of allButtons) {
        if (btn.textContent.toLowerCase().includes('compose')) {
          btn.click();
          return true;
        }
      }

      // Last resort: primary compose button class
      const primaryBtn = document.querySelector('.T-I.T-I-KE.L3');
      if (primaryBtn) {
        primaryBtn.click();
        return true;
      }

      return false;
    });

    if (!composeClicked) {
      throw new Error('Compose button not found');
    }
  }, 3, 'Click compose');

  console.log('[Gmail] Compose window opened');
  await wait(2000);

  // Fill To field
  await withRetry(async () => {
    const filled = await page.evaluate((recipient) => {
      const toInput = document.querySelector('input[aria-label="To recipients"]') ||
                      document.querySelector('input[aria-label="To"]') ||
                      document.querySelector('textarea[name="to"]') ||
                      document.querySelector('[name="to"]');
      if (toInput) {
        toInput.focus();
        toInput.value = recipient;
        toInput.dispatchEvent(new Event('input', { bubbles: true }));
        toInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, to);

    if (!filled) {
      throw new Error('To field not found');
    }
  }, 3, 'Fill To field');

  console.log(`[Gmail] Filled recipient: ${to}`);
  await wait(500);

  // Fill Subject
  await withRetry(async () => {
    const filled = await page.evaluate((subj) => {
      const subjInput = document.querySelector('input[name="subjectbox"]') ||
                        document.querySelector('input[aria-label="Subject"]');
      if (subjInput) {
        subjInput.focus();
        subjInput.value = subj;
        subjInput.dispatchEvent(new Event('input', { bubbles: true }));
        subjInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    }, subject);

    if (!filled) {
      throw new Error('Subject field not found');
    }
  }, 3, 'Fill Subject field');

  console.log(`[Gmail] Filled subject: ${subject}`);
  await wait(500);

  // Fill Body
  await withRetry(async () => {
    const filled = await page.evaluate((bodyText) => {
      const bodyDiv = document.querySelector('div[aria-label="Message Body"]') ||
                      document.querySelector('div.Am.Al.editable') ||
                      document.querySelector('[role="textbox"][aria-label*="Body"]') ||
                      document.querySelector('div[contenteditable="true"]');
      if (bodyDiv) {
        bodyDiv.focus();
        bodyDiv.innerHTML = bodyText.replace(/\n/g, '<br>');
        bodyDiv.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
      return false;
    }, body);

    if (!filled) {
      throw new Error('Body field not found');
    }
  }, 3, 'Fill Body field');

  console.log('[Gmail] Filled body');
  await wait(1000);

  // Click Send button
  console.log('[Gmail] Sending email...');
  await withRetry(async () => {
    const sent = await page.evaluate(() => {
      // Try multiple selectors for send button
      const sendBtn = document.querySelector('[aria-label*="Send"]') ||
                      document.querySelector('div[data-tooltip*="Send"]') ||
                      document.querySelector('.T-I.J-J5-Ji.aoO.v7.T-I-atl.L3');

      if (sendBtn) {
        sendBtn.click();
        return true;
      }

      // Fallback: keyboard shortcut
      return false;
    });

    if (!sent) {
      // Try Ctrl+Enter as fallback
      await page.keyboard.down('Control');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Control');
    }
  }, 3, 'Click send');

  console.log('[Gmail] Email sent successfully!');
  await wait(2000);

  return true;
}

// Main task function
async function sendEmail(page, params) {
  const { to, subject, body, accountEmail, accountPassword } = params;

  console.log('[Gmail] ========================================');
  console.log('[Gmail] Starting Gmail Send Email Task');
  console.log(`[Gmail] Account: ${accountEmail}`);
  console.log(`[Gmail] To: ${to}`);
  console.log(`[Gmail] Subject: ${subject}`);
  console.log('[Gmail] ========================================');

  if (!accountEmail || !accountPassword) {
    console.error('[Gmail] Error: Account credentials not provided');
    return { success: false, error: 'Account credentials not provided' };
  }

  if (!to || !subject) {
    console.error('[Gmail] Error: Recipient and subject are required');
    return { success: false, error: 'Recipient and subject are required' };
  }

  try {
    // Step 1: Login
    await withRetry(
      () => loginToGoogle(page, accountEmail, accountPassword),
      2,
      'Login to Google'
    );

    // Step 2: Compose and send
    await withRetry(
      () => composeAndSend(page, to, subject, body || ''),
      2,
      'Compose and send email'
    );

    console.log('[Gmail] ========================================');
    console.log('[Gmail] Task completed successfully!');
    console.log('[Gmail] ========================================');

    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    console.error('[Gmail] ========================================');
    console.error('[Gmail] Task failed:', error.message);
    console.error('[Gmail] ========================================');
    return { success: false, error: error.message };
  }
}

module.exports = {
  id: 'gmail_send',
  name: 'Gmail: Send Email',
  description: 'Login to Gmail and send an email',
  fields: ['to', 'subject', 'body'],
  execute: sendEmail
};
