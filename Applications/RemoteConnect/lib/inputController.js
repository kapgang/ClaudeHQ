const adb = require('@devicefarmer/adbkit');
const { EventEmitter } = require('events');

class InputController extends EventEmitter {
  constructor() {
    super();
    this.client = adb.default.createClient();
    this.inputQueues = new Map(); // serial -> queue
  }

  // Send tap event
  async tap(serial, x, y) {
    try {
      const device = this.client.getDevice(serial);
      await device.shell(`input tap ${x} ${y}`);
      this.emit('input', { serial, type: 'tap', x, y });
      return { success: true };
    } catch (err) {
      console.error(`Error sending tap to ${serial}:`, err);
      this.emit('inputError', { serial, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Send swipe gesture
  async swipe(serial, x1, y1, x2, y2, duration = 300) {
    try {
      const device = this.client.getDevice(serial);
      await device.shell(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
      this.emit('input', { serial, type: 'swipe', x1, y1, x2, y2, duration });
      return { success: true };
    } catch (err) {
      console.error(`Error sending swipe to ${serial}:`, err);
      this.emit('inputError', { serial, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Send text input
  async inputText(serial, text) {
    try {
      const device = this.client.getDevice(serial);
      // Escape special characters for shell
      const escaped = text.replace(/[\\$'"]/g, '\\$&');
      await device.shell(`input text "${escaped}"`);
      this.emit('input', { serial, type: 'text', text });
      return { success: true };
    } catch (err) {
      console.error(`Error sending text to ${serial}:`, err);
      this.emit('inputError', { serial, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Send key event (keycode)
  async keyEvent(serial, keycode) {
    try {
      const device = this.client.getDevice(serial);
      await device.shell(`input keyevent ${keycode}`);
      this.emit('input', { serial, type: 'key', keycode });
      return { success: true };
    } catch (err) {
      console.error(`Error sending key event to ${serial}:`, err);
      this.emit('inputError', { serial, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Send back button
  async back(serial) {
    return await this.keyEvent(serial, 4); // KEYCODE_BACK
  }

  // Send home button
  async home(serial) {
    return await this.keyEvent(serial, 3); // KEYCODE_HOME
  }

  // Send menu button
  async menu(serial) {
    return await this.keyEvent(serial, 82); // KEYCODE_MENU
  }

  // Send power button
  async power(serial) {
    return await this.keyEvent(serial, 26); // KEYCODE_POWER
  }

  // Launch app by package name
  async launchApp(serial, packageName, activityName = null) {
    try {
      const device = this.client.getDevice(serial);
      let command;
      
      if (activityName) {
        command = `am start -n ${packageName}/${activityName}`;
      } else {
        // Try to launch main activity
        command = `monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
      }
      
      await device.shell(command);
      this.emit('input', { serial, type: 'launchApp', packageName, activityName });
      return { success: true };
    } catch (err) {
      console.error(`Error launching app ${packageName} on ${serial}:`, err);
      this.emit('inputError', { serial, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Launch Google Chrome
  async launchChrome(serial) {
    // Chrome package name and main activity
    return await this.launchApp(serial, 'com.android.chrome', 'com.google.android.apps.chrome.Main');
  }

  // Long press (tap and hold)
  async longPress(serial, x, y, duration = 1000) {
    try {
      const device = this.client.getDevice(serial);
      await device.shell(`input swipe ${x} ${y} ${x} ${y} ${duration}`);
      this.emit('input', { serial, type: 'longPress', x, y, duration });
      return { success: true };
    } catch (err) {
      console.error(`Error sending long press to ${serial}:`, err);
      return { success: false, error: err.message };
    }
  }

  // Pinch zoom
  async pinchZoom(serial, centerX, centerY, scale) {
    // Pinch zoom requires two-finger gesture simulation
    // This is a simplified version - full implementation would require more complex gestures
    try {
      const device = this.client.getDevice(serial);
      const distance = 100;
      const x1 = centerX - distance;
      const y1 = centerY;
      const x2 = centerX + distance;
      const y2 = centerY;
      
      // For zoom in, move fingers closer together
      const newDistance = distance / scale;
      const x1End = centerX - newDistance;
      const x2End = centerX + newDistance;
      
      // Note: Actual pinch requires simultaneous two-finger input
      // This is a simplified version
      await device.shell(`input swipe ${x1} ${y1} ${x1End} ${y1} 300`);
      await device.shell(`input swipe ${x2} ${y2} ${x2End} ${y2} 300`);
      
      this.emit('input', { serial, type: 'pinchZoom', centerX, centerY, scale });
      return { success: true, note: 'Simplified pinch zoom implementation' };
    } catch (err) {
      console.error(`Error sending pinch zoom to ${serial}:`, err);
      return { success: false, error: err.message };
    }
  }
}

module.exports = InputController;



