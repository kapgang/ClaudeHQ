const adb = require('@devicefarmer/adbkit');
const { EventEmitter } = require('events');

class ProxyManager extends EventEmitter {
  constructor(deviceManager) {
    super();
    this.deviceManager = deviceManager;
    this.client = adb.default.createClient();
  }

  // Set HTTP proxy on device
  async setHttpProxy(serial, host, port) {
    try {
      const device = this.client.getDevice(serial);
      const proxyValue = `${host}:${port}`;
      
      // Set HTTP proxy
      await device.shell(`settings put global http_proxy ${proxyValue}`);
      
      // Update device state
      const proxyConfig = {
        type: 'http',
        host,
        port: parseInt(port),
        active: true,
        configuredAt: new Date().toISOString()
      };
      
      this.deviceManager.updateDevice(serial, { proxy: proxyConfig });
      this.emit('proxySet', { serial, proxy: proxyConfig });
      
      return { success: true, proxy: proxyConfig };
    } catch (err) {
      console.error(`Error setting HTTP proxy for ${serial}:`, err);
      this.emit('proxyError', { serial, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Remove proxy from device
  async removeProxy(serial) {
    try {
      const device = this.client.getDevice(serial);
      
      // Clear HTTP proxy
      await device.shell('settings delete global http_proxy');
      await device.shell('settings delete global global_http_proxy_host');
      await device.shell('settings delete global global_http_proxy_port');
      
      // Update device state
      this.deviceManager.updateDevice(serial, { proxy: null });
      this.emit('proxyRemoved', { serial });
      
      return { success: true };
    } catch (err) {
      console.error(`Error removing proxy for ${serial}:`, err);
      this.emit('proxyError', { serial, error: err.message });
      return { success: false, error: err.message };
    }
  }

  // Get current proxy setting
  async getProxy(serial) {
    try {
      const device = this.client.getDevice(serial);
      const proxyValue = await device.shell('settings get global http_proxy');
      
      const trimmed = proxyValue.trim();
      if (!trimmed || trimmed === 'null') {
        return null;
      }
      
      // Parse proxy value (format: host:port)
      const [host, port] = trimmed.split(':');
      return {
        type: 'http',
        host,
        port: parseInt(port),
        active: true
      };
    } catch (err) {
      console.error(`Error getting proxy for ${serial}:`, err);
      return null;
    }
  }

  // Test proxy connectivity (basic check)
  async testProxy(serial, host, port) {
    try {
      const device = this.client.getDevice(serial);
      
      // Try to connect to proxy host:port
      const result = await device.shell(`nc -z -w 3 ${host} ${port} && echo "SUCCESS" || echo "FAILED"`);
      
      return result.trim().includes('SUCCESS');
    } catch (err) {
      console.error(`Error testing proxy for ${serial}:`, err);
      return false;
    }
  }

  // Set SOCKS5 proxy (may require root or VPN app)
  async setSocks5Proxy(serial, host, port) {
    try {
      // Note: SOCKS5 typically requires root access or a VPN app
      // This is a placeholder that would need custom implementation
      // or integration with a proxy app like ProxyDroid
      
      const device = this.client.getDevice(serial);
      
      // Attempt to use settings (may not work without root)
      await device.shell(`settings put global socks_proxy ${host}:${port}`);
      
      const proxyConfig = {
        type: 'socks5',
        host,
        port: parseInt(port),
        active: true,
        configuredAt: new Date().toISOString()
      };
      
      this.deviceManager.updateDevice(serial, { proxy: proxyConfig });
      this.emit('proxySet', { serial, proxy: proxyConfig });
      
      return { success: true, proxy: proxyConfig, note: 'SOCKS5 may require root access' };
    } catch (err) {
      console.error(`Error setting SOCKS5 proxy for ${serial}:`, err);
      return { success: false, error: err.message };
    }
  }

  // Apply proxy configuration
  async applyProxy(serial, config) {
    if (!config || !config.host || !config.port) {
      return { success: false, error: 'Invalid proxy configuration' };
    }

    switch (config.type) {
      case 'http':
      case 'https':
        return await this.setHttpProxy(serial, config.host, config.port);
      case 'socks5':
        return await this.setSocks5Proxy(serial, config.host, config.port);
      default:
        return { success: false, error: 'Unsupported proxy type' };
    }
  }
}

module.exports = ProxyManager;



