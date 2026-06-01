/**
 * router.js — 雀定路由系统 v2.0
 * 基于 Hash 的 SPA 路由，支持参数、守卫、过渡动画
 */

// ==================== 路由配置 ====================
const Routes = {
  HOME: '/',
  BIRD: '/bird',
  DECISION: '/decision/:sceneId',
  HISTORY: '/history',
  PROFILE: '/profile'
};

// ==================== 路由记录类型 ====================
/**
 * @typedef {Object} RouteRecord
 * @property {string} path - 路由路径（支持动态参数如 :id）
 * @property {string} name - 路由名称
 * @property {string} pageId - 对应的 DOM 页面 ID
 * @property {Object} [meta] - 路由元信息
 * @property {boolean} [meta.requiresBird] - 是否需要先选择雀
 * @property {Function} [beforeEnter] - 进入前守卫
 */

// ==================== 路由注册表 ====================
const ROUTE_REGISTRY = [
  {
    path: Routes.HOME,
    name: 'home',
    pageId: 'page-main',
    meta: { title: '雀定', requiresBird: true }
  },
  {
    path: Routes.BIRD,
    name: 'bird',
    pageId: 'page-bird-select',
    meta: { title: '选择你的雀' }
  },
  {
    path: Routes.DECISION,
    name: 'decision',
    pageId: 'page-decision',
    meta: { title: '决策中', requiresBird: true },
    beforeEnter: (to, from) => {
      // 从 URL 参数中恢复场景状态
      const sceneId = to.params.sceneId;
      if (sceneId) {
        const scene = findSceneById(sceneId);
        if (scene) {
          // 触发场景启动
          window.__QUEDING_SCENE__ = scene;
          return true;
        }
      }
      // 找不到场景，返回首页
      Router.replace(Routes.HOME);
      return false;
    }
  },
  {
    path: Routes.HISTORY,
    name: 'history',
    pageId: 'page-history',
    meta: { title: '历史记录', requiresBird: true }
  },
  {
    path: Routes.PROFILE,
    name: 'profile',
    pageId: 'page-profile',
    meta: { title: '个人中心' }
  }
];

// ==================== Router 核心类 ====================
const Router = {
  // 当前路由状态
  currentRoute: null,
  currentPath: '',
  
  // 历史堆栈
  _history: [],
  _historyIndex: -1,
  
  // 是否正在处理导航（防止重复触发）
  _isNavigating: false,
  
  // 动画配置
  _transitionDuration: 250,
  
  // 初始化
  init() {
    // 监听浏览器前进/后退
    window.addEventListener('popstate', this._handlePopState.bind(this));
    
    // 监听 hashchange 作为备份
    window.addEventListener('hashchange', this._handleHashChange.bind(this));
    
    // 初始化时读取当前 hash
    this._handleInitialRoute();
    
    console.log('[Router] 初始化完成，当前路径:', this.currentPath);
  },
  
  // 处理初始路由
  _handleInitialRoute() {
    let hash = window.location.hash.slice(1) || Routes.HOME;
    
    // 确保 hash 以 / 开头
    if (!hash.startsWith('/')) {
      hash = '/' + hash;
    }
    
    this._navigateTo(hash, false, true);
  },
  
  // 处理浏览器前进/后退
  _handlePopState(e) {
    // popstate 事件处理
    if (e.state && e.state.path) {
      this._navigateTo(e.state.path, false, false);
    }
  },
  
  // 处理 hashchange
  _handleHashChange() {
    if (this._isNavigating) return;
    
    let hash = window.location.hash.slice(1) || Routes.HOME;
    if (!hash.startsWith('/')) {
      hash = '/' + hash;
    }
    
    this._navigateTo(hash, false, false);
  },
  
  // 核心导航方法
  _navigateTo(path, replace = false, initial = false) {
    if (this._isNavigating) return;
    this._isNavigating = true;
    
    // 解析路由
    const route = this._matchRoute(path);
    
    if (!route) {
      console.warn('[Router] 未找到路由:', path);
      this._isNavigating = false;
      return;
    }
    
    // 提取参数
    const params = this._extractParams(route, path);
    route.params = params;
    
    // 执行路由守卫
    if (!initial && route.beforeEnter) {
      const canEnter = route.beforeEnter({ ...route, path }, { ...this.currentRoute });
      if (canEnter === false) {
        this._isNavigating = false;
        return;
      }
    }
    
    // 检查是否需要先选择雀
    if (route.meta && route.meta.requiresBird) {
      const savedBirdId = Storage.getBird();
      if (!savedBirdId || !BIRDS[savedBirdId]) {
        console.log('[Router] 需要先选择雀，重定向到选雀页');
        this.replace(Routes.BIRD);
        this._isNavigating = false;
        return;
      }
    }
    
    // 保存到历史记录
    if (!initial) {
      this._updateHistory(path, replace);
    }
    
    // 更新当前路径
    this.currentPath = path;
    this.currentRoute = route;
    
    // 执行页面切换动画
    this._switchPage(route.pageId);
    
    // 更新文档标题
    if (route.meta && route.meta.title) {
      document.title = `${route.meta.title} — 雀定`;
    }
    
    // 更新导航高亮状态
    this._updateNavHighlight(route.name);
    
    // 触发路由变化回调
    this._onRouteChange(route);
    
    // 延迟重置导航状态
    setTimeout(() => {
      this._isNavigating = false;
    }, this._transitionDuration);
  },
  
  // 更新历史堆栈
  _updateHistory(path, replace) {
    if (replace) {
      // 替换当前历史记录
      this._history[this._historyIndex] = path;
    } else {
      // 添加新历史记录
      // 如果当前不在历史末端，先截断
      if (this._historyIndex < this._history.length - 1) {
        this._history = this._history.slice(0, this._historyIndex + 1);
      }
      this._history.push(path);
      this._historyIndex = this._history.length - 1;
    }
    
    // 同步到浏览器历史
    window.history.pushState({ path }, '', '#' + path);
  },
  
  // 匹配路由
  _matchRoute(path) {
    // 规范化路径
    path = path.split('?')[0]; // 去掉查询参数
    
    // 精确匹配
    let route = ROUTE_REGISTRY.find(r => r.path === path);
    if (route) return { ...route };
    
    // 参数匹配（如 /decision/eat 匹配 /decision/:sceneId）
    for (const record of ROUTE_REGISTRY) {
      const pattern = record.path.replace(/:[^/]+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(path)) {
        return { ...record };
      }
    }
    
    return null;
  },
  
  // 提取路由参数
  _extractParams(route, path) {
    const params = {};
    const pathParts = path.split('?')[0].split('/');
    const routeParts = route.path.split('/');
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = pathParts[i];
      }
    }
    
    return params;
  },
  
  // 切换页面
  _switchPage(pageId) {
    const pages = document.querySelectorAll('.page');
    const targetPage = document.getElementById(pageId);
    
    if (!targetPage) {
      console.error('[Router] 页面不存在:', pageId);
      return;
    }
    
    // 执行过渡动画
    pages.forEach(page => {
      if (page.id === pageId) {
        // 目标页面：从右侧滑入
        page.classList.add('page-enter');
        page.classList.remove('page-leave', 'page-hidden');
        
        // 触发动画
        requestAnimationFrame(() => {
          page.classList.add('page-enter-active');
        });
        
        // 动画结束后清理类名
        setTimeout(() => {
          page.classList.remove('page-enter', 'page-enter-active');
        }, this._transitionDuration);
      } else {
        // 其他页面：淡出并隐藏
        if (page.classList.contains('active')) {
          page.classList.add('page-leave');
          page.classList.remove('active');
          
          setTimeout(() => {
            page.classList.remove('page-leave');
            page.classList.add('page-hidden');
          }, this._transitionDuration);
        } else {
          page.classList.add('page-hidden');
        }
      }
    });
    
    // 激活目标页面
    setTimeout(() => {
      targetPage.classList.add('active');
    }, 10);
  },
  
  // 更新导航高亮
  _updateNavHighlight(routeName) {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.classList.remove('nav-active');
      
      // 根据路由名称匹配导航项
      const itemRoute = item.dataset.route;
      if (itemRoute === routeName) {
        item.classList.add('nav-active');
      }
      
      // 特殊处理：决策页也高亮首页导航
      if (routeName === 'decision' && item.dataset.route === 'home') {
        item.classList.add('nav-active');
      }
    });
  },
  
  // 路由变化回调（可扩展）
  _onRouteChange(route) {
    // 在这里可以执行路由变化后的逻辑
    // 如：数据预取、埋点等
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('routeChange', { 
      detail: route 
    }));
  },
  
  // ==================== 公开 API ====================
  
  /**
   * 编程式导航到指定路径
   * @param {string} path - 目标路径
   * @param {Object} [options] - 选项
   * @param {boolean} [options.replace] - 是否替换当前历史
   */
  push(path, options = {}) {
    if (path.startsWith('#')) {
      path = path.slice(1);
    }
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    this._navigateTo(path, options.replace || false, false);
  },
  
  /**
   * 替换当前历史记录并导航
   * @param {string} path - 目标路径
   */
  replace(path) {
    this.push(path, { replace: true });
  },
  
  /**
   * 后退
   * @param {number} [n=1] - 后退步数
   */
  goBack(n = 1) {
    window.history.go(-n);
  },
  
  /**
   * 前进
   * @param {number} [n=1] - 前进步数
   */
  goForward(n = 1) {
    window.history.go(n);
  },
  
  /**
   * 获取当前路由信息
   */
  getCurrentRoute() {
    return this.currentRoute;
  },
  
  /**
   * 获取当前路径
   */
  getCurrentPath() {
    return this.currentPath;
  },
  
  /**
   * 根据路由名称生成路径
   * @param {string} name - 路由名称
   * @param {Object} [params] - 路由参数
   */
  generatePath(name, params = {}) {
    const route = ROUTE_REGISTRY.find(r => r.name === name);
    if (!route) {
      console.warn('[Router] 未找到路由:', name);
      return '/';
    }
    
    let path = route.path;
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, value);
    }
    return path;
  }
};

// ==================== 辅助函数 ====================

/**
 * 根据场景 ID 查找场景
 */
function findSceneById(sceneId) {
  // 先从内置场景查找
  const builtin = BUILTIN_SCENES.find(s => s.id === sceneId);
  if (builtin) return builtin;
  
  // 再从自定义场景查找
  const custom = Storage.getCustomScenes().find(s => s.id === sceneId);
  if (custom) return custom;
  
  return null;
}

// ==================== 路由封装函数 ====================

/**
 * 导航到首页
 */
function goHome() {
  Router.push(Routes.HOME);
}

/**
 * 导航到选雀页
 */
function goBirdSelect() {
  Router.push(Routes.BIRD);
}

/**
 * 导航到决策页
 * @param {string} sceneId - 场景 ID
 */
function goDecision(sceneId) {
  const path = Router.generatePath('decision', { sceneId });
  Router.push(path);
}

/**
 * 导航到历史页
 */
function goHistory() {
  Router.push(Routes.HISTORY);
}

/**
 * 导航到个人中心
 */
function goProfile() {
  Router.push(Routes.PROFILE);
}

/**
 * 返回上一页
 */
function goBack() {
  Router.goBack();
}
