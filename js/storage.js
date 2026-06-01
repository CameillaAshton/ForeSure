/**
 * storage.js — localStorage 封装
 */

const Storage = {
  // 前缀，防止命名冲突
  PREFIX: 'quedingv1_',

  // 保存当前选中的雀
  saveBird(birdId) {
    localStorage.setItem(this.PREFIX + 'bird', birdId);
  },

  // 读取当前选中的雀
  getBird() {
    return localStorage.getItem(this.PREFIX + 'bird') || null;
  },

  // 保存某场景的上一次结果
  saveLastResult(sceneName, result) {
    const key = this.PREFIX + 'last_' + sceneName;
    localStorage.setItem(key, result);
  },

  // 获取某场景的上一次结果
  getLastResult(sceneName) {
    return localStorage.getItem(this.PREFIX + 'last_' + sceneName) || null;
  },

  // 添加历史记录
  addHistory(record) {
    // record: { scene, options, result, timestamp, bird }
    const key = this.PREFIX + 'history';
    const history = this.getHistory();
    history.unshift(record); // 最新的排前面
    // 最多保留 100 条
    const trimmed = history.slice(0, 100);
    localStorage.setItem(key, JSON.stringify(trimmed));
  },

  // 获取所有历史记录
  getHistory() {
    const raw = localStorage.getItem(this.PREFIX + 'history');
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // 清空历史记录
  clearHistory() {
    localStorage.removeItem(this.PREFIX + 'history');
    // 同时清空所有 last_ 记录
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
      if (k.startsWith(this.PREFIX + 'last_')) {
        localStorage.removeItem(k);
      }
    });
  },

  // 保存自定义场景列表
  saveCustomScenes(scenes) {
    localStorage.setItem(this.PREFIX + 'custom_scenes', JSON.stringify(scenes));
  },

  // 获取自定义场景列表
  getCustomScenes() {
    const raw = localStorage.getItem(this.PREFIX + 'custom_scenes');
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  // 添加一个自定义场景
  addCustomScene(scene) {
    const scenes = this.getCustomScenes();
    scenes.push(scene);
    this.saveCustomScenes(scenes);
  },

  // 删除一个自定义场景（按 id）
  removeCustomScene(id) {
    const scenes = this.getCustomScenes();
    const updated = scenes.filter(s => s.id !== id);
    this.saveCustomScenes(updated);
  },

  // 更新一个自定义场景（按 id）
  updateCustomScene(id, updates) {
    const scenes = this.getCustomScenes();
    const idx = scenes.findIndex(s => s.id === id);
    if (idx !== -1) {
      scenes[idx] = { ...scenes[idx], ...updates };
      this.saveCustomScenes(scenes);
      return scenes[idx];
    }
    return null;
  },

  // ===== 用户数据 =====
  // 保存用户信息
  saveUser(user) {
    localStorage.setItem(this.PREFIX + 'user', JSON.stringify(user));
  },

  // 获取用户信息
  getUser() {
    const raw = localStorage.getItem(this.PREFIX + 'user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  // 检查用户名是否存在（注册时用）
  hasUser(username) {
    const user = this.getUser();
    return user && user.username === username;
  },

  // 清除用户信息
  clearUser() {
    localStorage.removeItem(this.PREFIX + 'user');
  }
};
