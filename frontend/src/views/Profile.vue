<template>
  <div class="profile-page" v-loading="pageLoading">
    <section class="profile-hero">
      <div class="hero-cover" :style="heroCoverStyle">
        <button class="cover-upload" type="button" @click="triggerBgUpload">
          <el-icon><Camera /></el-icon>
          <span>更换封面</span>
        </button>
        <input
          ref="bgFileInput"
          type="file"
          accept="image/*"
          hidden
          @change="handleBackgroundChange"
        >
      </div>

      <div class="hero-panel">
        <div class="hero-main">
          <div class="avatar-shell">
            <el-upload
              class="avatar-uploader"
              :action="''"
              accept="image/png,image/jpeg"
              :auto-upload="false"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :on-change="handleAvatarChange"
            >
              <img :src="userAvatar" alt="用户头像" class="avatar-image">
              <div class="avatar-hover">
                <el-icon><Camera /></el-icon>
                <span>更换头像</span>
              </div>
            </el-upload>
            <span class="avatar-ring"></span>
          </div>

          <div class="hero-copy">
            <p class="hero-eyebrow">Personal Space</p>
            <h1>{{ displayName }}</h1>
            <p class="hero-signature">{{ userSignature }}</p>

            <div class="hero-tags">
              <span class="hero-tag">Lv.{{ userLevel }}</span>
              <span class="hero-tag">{{ currentUser.role === 'admin' ? '管理员' : '创作者' }}</span>
              <span class="hero-tag">资料完整度 {{ profileCompletion }}%</span>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <el-button
            type="primary"
            size="large"
            class="action-button"
            :disabled="userStore.signStatus.todaySigned"
            @click="handleSignIn"
          >
            <el-icon><Ticket /></el-icon>
            {{ userStore.signStatus.todaySigned ? '今日已签到' : '立即签到' }}
          </el-button>

          <el-badge
            :value="userStore.notifications.unreadCount"
            :hidden="userStore.notifications.unreadCount === 0"
          >
            <el-button size="large" class="action-button secondary" @click="handleNotifications">
              <el-icon><Bell /></el-icon>
              消息通知
            </el-button>
          </el-badge>
        </div>

        <div class="hero-stats">
          <div v-for="item in heroStats" :key="item.label" class="hero-stat">
            <div class="hero-stat-icon">
              <el-icon><component :is="item.icon" /></el-icon>
            </div>
            <div>
              <div class="hero-stat-value">{{ item.value }}</div>
              <div class="hero-stat-label">{{ item.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="page-shell">
      <main class="main-column">
        <section class="section-nav">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            class="nav-pill"
            :class="{ active: activeNav === item.key }"
            @click="activeNav = item.key"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </section>

        <template v-if="activeNav === 'home'">
          <section class="overview-grid">
            <article class="section-card">
              <header class="section-card-header">
                <div>
                  <p class="section-kicker">Recent Activity</p>
                  <h2>最近动态</h2>
                </div>
              </header>

              <div v-if="activityItems.length" class="timeline-list">
                <div v-for="activity in activityItems" :key="activity.id" class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div class="timeline-body">
                    <div class="timeline-meta">
                      <span class="timeline-type">{{ getActivityLabel(activity.type) }}</span>
                      <time>{{ formatTimelineTime(activity) }}</time>
                    </div>
                    <p>{{ activity.content }}</p>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂时还没有动态记录" />
            </article>

            <article class="section-card">
              <header class="section-card-header">
                <div>
                  <p class="section-kicker">Recent Posts</p>
                  <h2>最近发布</h2>
                </div>
                <el-button text @click="activeNav = 'articles'">查看全部</el-button>
              </header>

              <div v-if="recentArticles.length" class="compact-list">
                <button
                  v-for="article in recentArticles.slice(0, 4)"
                  :key="article.id"
                  type="button"
                  class="compact-item"
                  @click="goToArticle(article.id)"
                >
                  <div>
                    <h3>{{ article.title }}</h3>
                    <p>{{ getArticleExcerpt(article) }}</p>
                  </div>
                  <div class="compact-meta">
                    <span>{{ formatArticleDate(article.createdAt) }}</span>
                    <span>{{ getArticleViews(article) }} 阅读</span>
                  </div>
                </button>
              </div>
              <el-empty v-else description="还没有文章内容" />
            </article>
          </section>

          <section class="overview-insights">
            <article class="section-card">
              <header class="section-card-header">
                <div>
                  <p class="section-kicker">AI Snapshot</p>
                  <h2>写作画像</h2>
                </div>
              </header>

              <div v-if="writingStyle.style" class="insight-panel">
                <div class="insight-row">
                  <span class="insight-label">整体风格</span>
                  <strong>{{ writingStyle.style }}</strong>
                </div>
                <div class="insight-row">
                  <span class="insight-label">易读性</span>
                  <el-rate
                    :model-value="parseInt(writingStyle.readability, 10)"
                    :max="10"
                    disabled
                    show-score
                  />
                </div>
                <div class="tag-cloud">
                  <el-tag
                    v-for="item in writingStyle.strengths.slice(0, 4)"
                    :key="`strength-${item}`"
                    type="success"
                    effect="plain"
                  >
                    {{ item }}
                  </el-tag>
                  <el-tag
                    v-for="item in writingStyle.improvements.slice(0, 3)"
                    :key="`suggest-${item}`"
                    type="warning"
                    effect="plain"
                  >
                    {{ item }}
                  </el-tag>
                </div>
              </div>
              <el-empty v-else description="文章数量较少，暂时无法生成画像" />
            </article>

            <article class="section-card">
              <header class="section-card-header">
                <div>
                  <p class="section-kicker">Recommended Reads</p>
                  <h2>推荐阅读</h2>
                </div>
                <el-button text @click="activeNav = 'ai'">进入 AI 洞察</el-button>
              </header>

              <div v-if="readingRecommendations.length" class="recommendation-list">
                <button
                  v-for="article in readingRecommendations.slice(0, 5)"
                  :key="article.id"
                  type="button"
                  class="recommendation-item"
                  @click="goToArticle(article.id)"
                >
                  <el-icon><Document /></el-icon>
                  <span>{{ article.title }}</span>
                </button>
              </div>
              <el-empty v-else description="暂时没有推荐内容" />
            </article>
          </section>
        </template>

        <template v-else-if="activeNav === 'articles'">
          <section class="section-card">
            <header class="section-card-header">
              <div>
                <p class="section-kicker">Content Manager</p>
                <h2>我的文章</h2>
              </div>
              <el-button type="primary" @click="goToCreateArticle">
                <el-icon><Plus /></el-icon>
                写文章
              </el-button>
            </header>

            <div v-if="recentArticles.length" class="panel-list">
              <article v-for="article in recentArticles" :key="article.id" class="panel-item">
                <div class="panel-main">
                  <div class="panel-title-row">
                    <button type="button" class="title-button" @click="goToArticle(article.id)">
                      {{ article.title }}
                    </button>
                    <el-tag :type="getArticleStatusType(article.status)" effect="plain">
                      {{ getArticleStatusLabel(article.status) }}
                    </el-tag>
                  </div>
                  <p class="panel-summary">{{ getArticleExcerpt(article) }}</p>
                  <div class="panel-meta">
                    <span>{{ formatArticleDate(article.createdAt) }}</span>
                    <span>{{ getArticleViews(article) }} 阅读</span>
                    <span>{{ article.likeCount ?? 0 }} 点赞</span>
                  </div>
                </div>

                <div class="panel-actions">
                  <el-button plain @click="goToEditArticle(article.id)">编辑</el-button>
                  <el-button type="danger" plain @click="handleDeleteArticle(article.id)">删除</el-button>
                </div>
              </article>
            </div>
            <el-empty v-else description="还没有可以管理的文章" />
          </section>
        </template>

        <template v-else-if="activeNav === 'dashboard'">
          <section class="section-card">
            <header class="section-card-header">
              <div>
                <p class="section-kicker">Performance</p>
                <h2>数据看板</h2>
              </div>
            </header>

            <div class="dashboard-grid">
              <div v-for="item in dashboardStats" :key="item.label" class="dashboard-card">
                <div class="dashboard-icon">
                  <el-icon><component :is="item.icon" /></el-icon>
                </div>
                <div class="dashboard-value">{{ item.value }}</div>
                <div class="dashboard-label">{{ item.label }}</div>
              </div>
            </div>

            <div class="chart-panel">
              <div class="chart-copy">
                <p class="section-kicker">Trend</p>
                <h3>内容趋势</h3>
                <p>把近期内容产出和阅读变化集中放在这里，方便你快速判断创作节奏。</p>
              </div>
              <ArticleTrendChart />
            </div>
          </section>
        </template>

        <template v-else-if="activeNav === 'drafts'">
          <section class="section-card">
            <header class="section-card-header">
              <div>
                <p class="section-kicker">Draft Box</p>
                <h2>草稿箱</h2>
              </div>
            </header>

            <div v-if="drafts.length" class="panel-list">
              <article v-for="draft in drafts" :key="draft.id" class="panel-item">
                <div class="panel-main">
                  <div class="panel-title-row">
                    <button type="button" class="title-button" @click="goToEditArticle(draft.id)">
                      {{ draft.title }}
                    </button>
                    <el-tag type="warning" effect="plain">草稿</el-tag>
                  </div>
                  <div class="panel-meta">
                    <span>{{ formatArticleDate(draft.updatedAt) }}</span>
                    <span>{{ draft.wordCount }} 字</span>
                  </div>
                </div>

                <div class="panel-actions">
                  <el-button plain @click="goToEditArticle(draft.id)">继续编辑</el-button>
                  <el-button type="danger" plain @click="deleteDraft(draft.id)">删除</el-button>
                </div>
              </article>
            </div>
            <el-empty v-else description="草稿箱还是空的" />
          </section>
        </template>

        <template v-else-if="activeNav === 'history'">
          <section class="section-card">
            <header class="section-card-header">
              <div>
                <p class="section-kicker">Reading Log</p>
                <h2>阅读历史</h2>
              </div>
              <el-button plain @click="clearHistory">
                <el-icon><Delete /></el-icon>
                清空历史
              </el-button>
            </header>

            <div v-if="readingHistory.length" class="panel-list">
              <article v-for="item in readingHistory" :key="item.id" class="panel-item">
                <div class="panel-main">
                  <div class="panel-title-row">
                    <button type="button" class="title-button" @click="goToArticle(item.id)">
                      {{ item.title }}
                    </button>
                  </div>
                  <div class="panel-meta">
                    <span>{{ formatArticleDate(item.readAt) }}</span>
                    <span>{{ item.author }}</span>
                  </div>
                </div>

                <div class="panel-actions">
                  <el-button plain @click="goToArticle(item.id)">查看文章</el-button>
                </div>
              </article>
            </div>
            <el-empty v-else description="还没有阅读记录" />
          </section>
        </template>

        <template v-else-if="activeNav === 'settings'">
          <section class="section-card">
            <header class="section-card-header">
              <div>
                <p class="section-kicker">Account Settings</p>
                <h2>账户设置</h2>
              </div>
            </header>

            <el-tabs v-model="activeTab" class="settings-tabs">
              <el-tab-pane label="基本资料" name="basic">
                <div class="settings-layout">
                  <div class="settings-block">
                    <h3>编辑资料</h3>
                    <p>统一维护你的基础信息和个人介绍，让个人主页更完整。</p>

                    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
                      <el-form-item label="用户名">
                        <el-input v-model="form.username" disabled />
                      </el-form-item>
                      <el-form-item label="邮箱" prop="email">
                        <el-input v-model="form.email" />
                      </el-form-item>
                      <el-form-item label="个性签名" prop="bio">
                        <el-input v-model="form.bio" type="textarea" :rows="4" />
                      </el-form-item>
                      <el-form-item>
                        <el-button type="primary" @click="handleUpdateProfile">保存修改</el-button>
                      </el-form-item>
                    </el-form>
                  </div>

                  <div class="settings-tip-card">
                    <p class="tip-title">资料建议</p>
                    <ul>
                      <li>签名尽量一句话说清你的创作方向。</li>
                      <li>头像和封面统一风格，页面会更完整。</li>
                      <li>邮箱建议保持最新，便于账号找回和通知触达。</li>
                    </ul>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="修改密码" name="password">
                <div class="settings-layout">
                  <div class="settings-block">
                    <h3>安全更新</h3>
                    <p>定期修改密码可以提升账号安全性。</p>

                    <el-form
                      ref="passwordFormRef"
                      :model="passwordForm"
                      :rules="passwordRules"
                      label-position="top"
                    >
                      <el-form-item label="旧密码" prop="oldPassword">
                        <el-input v-model="passwordForm.oldPassword" type="password" show-password />
                      </el-form-item>
                      <el-form-item label="新密码" prop="newPassword">
                        <el-input v-model="passwordForm.newPassword" type="password" show-password />
                      </el-form-item>
                      <el-form-item label="确认新密码" prop="confirmPassword">
                        <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
                      </el-form-item>
                      <el-form-item>
                        <el-button type="primary" @click="handleChangePassword">更新密码</el-button>
                      </el-form-item>
                    </el-form>
                  </div>

                  <div class="settings-tip-card">
                    <p class="tip-title">密码建议</p>
                    <ul>
                      <li>长度至少 6 位，尽量同时包含字母和数字。</li>
                      <li>不要和其他网站使用相同密码。</li>
                      <li>修改后请重新确认常用设备的登录状态。</li>
                    </ul>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="账户安全" name="security">
                <div class="security-list">
                  <div class="security-item">
                    <div>
                      <h3>退出当前账号</h3>
                      <p>如果你在公共设备上使用，建议及时退出登录。</p>
                    </div>
                    <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="外观设置" name="appearance">
                <div class="settings-layout">
                  <div class="settings-block">
                    <h3>主题模式</h3>
                    <p>选择适合你的界面外观，浅色背景配黑色文字，深色背景配白色文字，确保阅读舒适度。</p>

                    <div class="theme-options">
                      <button
                        type="button"
                        class="theme-option"
                        :class="{ active: !themeStore.followSystem && themeStore.themeMode === 'light' }"
                        @click="themeStore.setTheme('light')"
                      >
                        <div class="theme-icon">
                          <el-icon><Sunny /></el-icon>
                        </div>
                        <div>
                          <strong>浅色模式</strong>
                          <span>白底黑字，清晰明亮</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        class="theme-option"
                        :class="{ active: !themeStore.followSystem && themeStore.themeMode === 'dark' }"
                        @click="themeStore.setTheme('dark')"
                      >
                        <div class="theme-icon dark-icon">
                          <el-icon><Moon /></el-icon>
                        </div>
                        <div>
                          <strong>深色模式</strong>
                          <span>黑底白字，护眼舒适</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        class="theme-option"
                        :class="{ active: themeStore.followSystem }"
                        @click="themeStore.toggleFollowSystem()"
                      >
                        <div class="theme-icon system-icon">
                          <el-icon><Monitor /></el-icon>
                        </div>
                        <div>
                          <strong>跟随系统</strong>
                          <span>自动匹配系统设置</span>
                        </div>
                      </button>
                    </div>

                    <div class="theme-preview">
                      <div class="preview-label">当前预览</div>
                      <div class="preview-card" :class="{ 'dark-preview': themeStore.isDarkMode }">
                        <div class="preview-title">文章标题示例</div>
                        <div class="preview-content">这是一段文章内容的预览文本，用于展示主题切换后的效果。</div>
                      </div>
                    </div>
                  </div>

                  <div class="settings-tip-card">
                    <p class="tip-title">主题设置说明</p>
                    <ul>
                      <li>浅色模式适合白天使用，文字清晰易读</li>
                      <li>深色模式适合夜间使用，减少眼睛疲劳</li>
                      <li>跟随系统会根据系统设置自动切换</li>
                    </ul>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </section>
        </template>

        <template v-else-if="activeNav === 'ai'">
          <section class="section-card">
            <header class="section-card-header">
              <div>
                <p class="section-kicker">AI Insights</p>
                <h2>AI 洞察</h2>
              </div>
            </header>

            <div class="ai-grid">
              <article class="ai-panel">
                <h3>写作风格分析</h3>
                <div v-if="writingStyle.style" class="analysis-grid">
                  <div class="analysis-item">
                    <span>整体风格</span>
                    <strong>{{ writingStyle.style }}</strong>
                  </div>
                  <div class="analysis-item">
                    <span>易读性评分</span>
                    <strong>{{ writingStyle.readability }}/10</strong>
                  </div>
                  <div class="analysis-block">
                    <p>你的优势</p>
                    <div class="tag-cloud">
                      <el-tag
                        v-for="item in writingStyle.strengths"
                        :key="`strength-full-${item}`"
                        type="success"
                        effect="plain"
                      >
                        {{ item }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="analysis-block">
                    <p>可优化方向</p>
                    <div class="tag-cloud">
                      <el-tag
                        v-for="item in writingStyle.improvements"
                        :key="`improvement-${item}`"
                        type="warning"
                        effect="plain"
                      >
                        {{ item }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无足够文章进行分析" />
              </article>

              <article class="ai-panel">
                <h3>个性化推荐</h3>
                <div v-if="readingRecommendations.length" class="recommendation-list">
                  <button
                    v-for="article in readingRecommendations"
                    :key="article.id"
                    type="button"
                    class="recommendation-item"
                    @click="goToArticle(article.id)"
                  >
                    <el-icon><Reading /></el-icon>
                    <span>{{ article.title }}</span>
                  </button>
                </div>
                <el-empty v-else description="暂时没有推荐阅读" />
              </article>
            </div>
          </section>
        </template>
      </main>

      <aside class="side-column">
        <template v-if="activeNav === 'settings'">
          <article class="side-card">
            <header class="side-card-header">
              <div>
                <p class="section-kicker">Growth</p>
                <h3>成长进度</h3>
              </div>
            </header>

            <div class="growth-panel">
              <div class="growth-top">
                <span class="level-pill">Lv.{{ userLevel }}</span>
                <span>距离下一级还差 {{ levelNeed }} 经验</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" :style="{ width: `${levelProgress}%` }"></div>
              </div>
              <div class="growth-tips">
                <p>发布文章 +5 经验</p>
                <p>完成签到 +1 经验</p>
                <p>收获点赞 +1 经验</p>
              </div>
            </div>
          </article>

          <article class="side-card">
            <header class="side-card-header">
              <div>
                <p class="section-kicker">Quick Actions</p>
                <h3>快捷操作</h3>
              </div>
            </header>

            <div class="quick-actions">
              <button type="button" class="quick-action" @click="activeNav = 'settings'">
                <el-icon><Edit /></el-icon>
                <span>编辑资料</span>
              </button>
              <button
                type="button"
                class="quick-action"
                @click="activeNav = 'settings'; activeTab = 'password'"
              >
                <el-icon><Lock /></el-icon>
                <span>修改密码</span>
              </button>
              <button type="button" class="quick-action" @click="goToCreateArticle">
                <el-icon><Plus /></el-icon>
                <span>创建文章</span>
              </button>
              <button type="button" class="quick-action danger" @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </button>
            </div>
          </article>

          <article class="side-card">
            <header class="side-card-header">
              <div>
                <p class="section-kicker">Discover</p>
                <h3>推荐关注</h3>
              </div>
            </header>

            <div v-if="recommendedUsers.length" class="follow-list">
              <div v-for="user in recommendedUsers" :key="user.id" class="follow-item">
                <img :src="user.avatar || defaultAvatar" alt="推荐用户头像" class="follow-avatar">
                <div class="follow-copy">
                  <strong>{{ user.username }}</strong>
                  <p>{{ user.bio || '这个人还没有留下简介。' }}</p>
                </div>
                <el-button size="small" plain @click="followUser(user.id)">关注</el-button>
              </div>
            </div>
            <el-empty v-else description="暂时没有推荐用户" />
          </article>
        </template>

        <template v-else>
          <article class="side-card">
            <header class="side-card-header">
              <div>
                <p class="section-kicker">Account Overview</p>
                <h3>账户概览</h3>
              </div>
            </header>

            <dl class="meta-list">
              <div>
                <dt>用户名</dt>
                <dd>{{ currentUser.username || '未设置' }}</dd>
              </div>
              <div>
                <dt>邮箱</dt>
                <dd>{{ currentUser.email || '未设置' }}</dd>
              </div>
              <div>
                <dt>注册时间</dt>
                <dd>{{ currentUser.createdAt ? formatArticleDate(currentUser.createdAt) : '暂无记录' }}</dd>
              </div>
              <div>
                <dt>最近登录</dt>
                <dd>{{ currentUser.lastLogin ? formatArticleDate(currentUser.lastLogin) : '暂无记录' }}</dd>
              </div>
            </dl>
          </article>

          <article class="side-card">
            <header class="side-card-header">
              <div>
                <p class="section-kicker">Check In</p>
                <h3>签到状态</h3>
              </div>
            </header>

            <div class="checkin-card">
              <div class="checkin-row">
                <span>今日签到</span>
                <strong :class="{ success: userStore.signStatus.todaySigned }">
                  {{ userStore.signStatus.todaySigned ? '已完成' : '未签到' }}
                </strong>
              </div>
              <div class="checkin-row">
                <span>连续签到</span>
                <strong>{{ userStore.signStatus.consecutiveDays }} 天</strong>
              </div>
              <div class="checkin-row">
                <span>累计签到</span>
                <strong>{{ userStore.signStatus.totalSigns }} 次</strong>
              </div>
              <el-button
                type="primary"
                class="full-button"
                :disabled="userStore.signStatus.todaySigned"
                @click="handleSignIn"
              >
                {{ userStore.signStatus.todaySigned ? '今天已完成' : '去签到' }}
              </el-button>
            </div>
          </article>
        </template>
      </aside>
    </div>

    <el-dialog
      v-model="notificationDialogVisible"
      width="520px"
      class="profile-notify-dialog"
      title="消息通知"
    >
      <div v-if="notificationItems.length" class="notification-dialog-toolbar">
        <span>未读 {{ unreadNotificationCount }} 条</span>
        <el-button
          plain
          size="small"
          :disabled="unreadNotificationCount === 0"
          @click="markAllNotificationsAsRead"
        >
          全部标记已读
        </el-button>
      </div>
      <div v-if="notificationItems.length" class="notification-list">
        <div
          v-for="notification in notificationItems"
          :key="notification.id"
          class="notification-item"
          :class="{ unread: !notification.read }"
        >
          <div class="notification-copy">
            <div class="notification-top">
              <span class="notification-type">{{ notification.read ? '已读' : '未读' }}</span>
              <time>{{ formatDateTime(notification.createdAt) }}</time>
            </div>
            <p>{{ notification.content }}</p>
          </div>
          <el-button
            v-if="!notification.read"
            size="small"
            plain
            @click="markNotificationAsRead(notification.id)"
          >
            标记已读
          </el-button>
        </div>
      </div>
      <el-empty v-else description="当前没有新的通知" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type UploadFile,
  type UploadProps,
} from 'element-plus'
import {
  Bell,
  Camera,
  ChatLineRound,
  DataAnalysis,
  Delete,
  Document,
  Edit,
  House,
  Lock,
  Monitor,
  Moon,
  Plus,
  Reading,
  Setting,
  Star,
  Sunny,
  SwitchButton,
  Ticket,
  User,
  View,
} from '@element-plus/icons-vue'
import defaultAvatar from '@/assets/default-avatar.svg'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { analyzeWritingStyle, getReadingRecommendations } from '@/api/ai'
import { deleteArticle as deleteArticleApi } from '@/api/article'
import ArticleTrendChart from '@/components/ArticleTrendChart.vue'
import { formatDate, truncateText, validateEmail } from '@/utils/tools'
import type { Article, ArticleStatus, Notification, User as UserModel } from '@/types'

type NavKey = 'home' | 'articles' | 'dashboard' | 'drafts' | 'history' | 'settings' | 'ai'
type SettingsTab = 'basic' | 'password' | 'security' | 'appearance'

interface ActivityItem {
  id: number
  content: string
  createdAt?: string
  time?: string
  type?: string
}

interface ProfileArticle extends Partial<Article> {
  id: number
  title: string
  createdAt?: string
  updatedAt?: string
  views?: number
  viewCount?: number
  likeCount?: number
  status?: ArticleStatus
}

interface DraftItem {
  id: number
  title: string
  updatedAt: string
  wordCount: number
}

interface ReadingHistoryItem {
  id: number
  title: string
  readAt: string
  author: string
}

interface WritingStyleData {
  style: string
  strengths: string[]
  improvements: string[]
  commonTopics: string[]
  readability: string
}

interface RecommendationItem {
  id: number
  title: string
}

const userStore = useUserStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()

const defaultUser: UserModel = {
  id: 0,
  username: '未命名用户',
  email: '',
  role: 'user',
  avatar: defaultAvatar,
  bio: '',
}

const navItems = [
  { key: 'home' as NavKey, label: '总览', icon: House },
  { key: 'articles' as NavKey, label: '文章', icon: Document },
  { key: 'dashboard' as NavKey, label: '数据', icon: DataAnalysis },
  { key: 'drafts' as NavKey, label: '草稿', icon: Edit },
  { key: 'history' as NavKey, label: '历史', icon: Reading },
  { key: 'settings' as NavKey, label: '设置', icon: Setting },
  { key: 'ai' as NavKey, label: 'AI 洞察', icon: Star },
]

const activeNav = ref<NavKey>('home')
const activeTab = ref<SettingsTab>('basic')
const notificationDialogVisible = ref(false)
const pageLoading = ref(false)
const backgroundImage = ref(localStorage.getItem('profileBackground') || '')
const bgFileInput = ref<HTMLInputElement | null>(null)

const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const form = reactive({
  username: '',
  email: '',
  bio: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const drafts = ref<DraftItem[]>([])
const readingHistory = ref<ReadingHistoryItem[]>([])
const readingRecommendations = ref<RecommendationItem[]>([])
const writingStyle = ref<WritingStyleData>({
  style: '',
  strengths: [],
  improvements: [],
  commonTopics: [],
  readability: '0',
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (!validateEmail(value)) {
          callback(new Error('请输入正确的邮箱格式'))
          return
        }
        callback()
      },
      trigger: 'blur',
    },
  ],
  bio: [{ max: 100, message: '签名不能超过 100 个字符', trigger: 'blur' }],
}

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const currentUser = computed(() => userStore.user ?? defaultUser)

const displayName = computed(() => currentUser.value.nickname || currentUser.value.username)

const userAvatar = computed(() => currentUser.value.avatar || defaultAvatar)

const userSignature = computed(() => currentUser.value.bio || '把生活感受与创作灵感，都安静地放进这里。')

const totalExp = computed(() => (
  (userStore.userStats.articleCount ?? 0) * 5
  + (userStore.signStatus.totalSigns ?? 0)
  + (userStore.userStats.likeCount ?? 0)
))

const userLevel = computed(() => Math.floor(totalExp.value / 10) + 1)

const levelProgress = computed(() => ((totalExp.value % 10) / 10) * 100)

const levelNeed = computed(() => 10 - (totalExp.value % 10 || 0))

const profileCompletion = computed(() => {
  const checks = [
    Boolean(currentUser.value.email),
    Boolean(currentUser.value.bio),
    Boolean(currentUser.value.createdAt),
    Boolean(currentUser.value.avatar && currentUser.value.avatar !== defaultAvatar),
  ]

  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
})

const heroCoverStyle = computed(() => ({
  backgroundImage: backgroundImage.value
    ? `linear-gradient(135deg, rgba(11, 37, 42, 0.24), rgba(147, 109, 34, 0.18)), url(${backgroundImage.value})`
    : 'linear-gradient(135deg, rgba(25, 73, 86, 0.96), rgba(32, 105, 95, 0.9) 45%, rgba(154, 115, 49, 0.78))',
}))

const heroStats = computed(() => [
  {
    label: '文章',
    value: formatCompactNumber(userStore.userStats.articleCount ?? 0),
    icon: Document,
  },
  {
    label: '阅读',
    value: formatCompactNumber(userStore.userStats.viewCount ?? 0),
    icon: View,
  },
  {
    label: '粉丝',
    value: formatCompactNumber(userStore.userStats.followerCount ?? 0),
    icon: User,
  },
  {
    label: '点赞',
    value: formatCompactNumber(userStore.userStats.likeCount ?? 0),
    icon: Star,
  },
])

const dashboardStats = computed(() => [
  {
    label: '文章总数',
    value: formatCompactNumber(userStore.userStats.articleCount ?? 0),
    icon: Document,
  },
  {
    label: '总阅读量',
    value: formatCompactNumber(userStore.userStats.viewCount ?? 0),
    icon: View,
  },
  {
    label: '总点赞数',
    value: formatCompactNumber(userStore.userStats.likeCount ?? 0),
    icon: Star,
  },
  {
    label: '评论互动',
    value: formatCompactNumber(userStore.userStats.commentCount ?? 0),
    icon: ChatLineRound,
  },
])

const activityItems = computed<ActivityItem[]>(() => {
  if (!Array.isArray(userStore.activities)) {
    return []
  }

  return userStore.activities.map((item, index) => {
    const record = toRecord(item)
    return {
      id: toNumber(record.id, index + 1),
      content: toStringValue(record.content, '暂无动态'),
      createdAt: toStringValue(record.createdAt ?? record.created_at),
      time: toStringValue(record.time),
      type: toStringValue(record.activity_type ?? record.type),
    }
  })
})

const recentArticles = computed<ProfileArticle[]>(() => {
  if (!Array.isArray(userStore.recentArticles)) {
    return []
  }

  return userStore.recentArticles.map((item, index) => normalizeArticle(item, index))
})

const recommendedUsers = computed(() => userStore.social.recommended.slice(0, 4))

const notificationItems = computed<Notification[]>(() => userStore.notifications.list ?? [])
const unreadNotificationCount = computed(() => (
  notificationItems.value.filter((item) => !item.read).length
))

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function normalizeArticle(item: unknown, index: number): ProfileArticle {
  const record = toRecord(item)
  const status = toStringValue(record.status, 'published') as ArticleStatus

  return {
    id: toNumber(record.id, index + 1),
    title: toStringValue(record.title, '未命名文章'),
    summary: toStringValue(record.summary),
    content: toStringValue(record.content),
    createdAt: toStringValue(record.createdAt ?? record.created_at),
    updatedAt: toStringValue(record.updatedAt ?? record.updated_at),
    status,
    views: toNumber(record.views ?? record.viewCount ?? record.view_count),
    viewCount: toNumber(record.viewCount ?? record.view_count ?? record.views),
    likeCount: toNumber(record.likeCount ?? record.like_count),
  }
}

function formatCompactNumber(value: number): string {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }

  return String(value)
}

function formatArticleDate(date?: string): string {
  if (!date) {
    return '暂无时间'
  }

  return formatDate(date, 'YYYY-MM-DD')
}

function formatDateTime(date?: string): string {
  if (!date) {
    return '暂无时间'
  }

  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

function formatTimelineTime(activity: ActivityItem): string {
  if (activity.createdAt) {
    return formatDate(activity.createdAt, 'MM-DD HH:mm')
  }

  return activity.time || '刚刚'
}

function getActivityLabel(type?: string): string {
  const typeMap: Record<string, string> = {
    checkin: '签到',
    article: '文章',
    comment: '评论',
    like: '点赞',
  }

  return type ? (typeMap[type] || '动态') : '动态'
}

function getArticleExcerpt(article: ProfileArticle): string {
  if (article.summary) {
    return truncateText(article.summary, 88)
  }

  if (article.content) {
    return truncateText(article.content.replace(/\s+/g, ' '), 88)
  }

  return '还没有摘要内容，继续补充这篇文章吧。'
}

function getArticleViews(article: ProfileArticle): number {
  return article.viewCount ?? article.views ?? 0
}

function getArticleStatusLabel(status?: ArticleStatus): string {
  if (status === 'draft') {
    return '草稿'
  }

  if (status === 'scheduled') {
    return '待发布'
  }

  return '已发布'
}

function getArticleStatusType(status?: ArticleStatus): 'success' | 'warning' | 'info' {
  if (status === 'draft') {
    return 'warning'
  }

  if (status === 'scheduled') {
    return 'info'
  }

  return 'success'
}

function loadDrafts() {
  try {
    const localDrafts = JSON.parse(localStorage.getItem('drafts') || '[]') as DraftItem[]
    drafts.value = Array.isArray(localDrafts)
      ? [...localDrafts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      : []
  } catch {
    drafts.value = []
  }
}

function loadReadingHistory() {
  try {
    const localHistory = JSON.parse(localStorage.getItem('readingHistory') || '[]') as ReadingHistoryItem[]
    readingHistory.value = Array.isArray(localHistory)
      ? [...localHistory].sort((a, b) => new Date(b.readAt).getTime() - new Date(a.readAt).getTime())
      : []
  } catch {
    readingHistory.value = []
  }
}

async function loadProfile() {
  await userStore.fetchProfile()
  form.username = currentUser.value.username
  form.email = currentUser.value.email
  form.bio = currentUser.value.bio || ''
}

async function loadWritingStyle() {
  if (!userStore.userId) {
    return
  }

  try {
    const response = await analyzeWritingStyle(userStore.userId)
    const payload = toRecord(response)
    const data = toRecord(payload.data)

    writingStyle.value = {
      style: toStringValue(data.style),
      strengths: Array.isArray(data.strengths) ? data.strengths.map((item) => String(item)) : [],
      improvements: Array.isArray(data.improvements) ? data.improvements.map((item) => String(item)) : [],
      commonTopics: Array.isArray(data.commonTopics) ? data.commonTopics.map((item) => String(item)) : [],
      readability: toStringValue(data.readability, '0'),
    }
  } catch {
    writingStyle.value = {
      style: '',
      strengths: [],
      improvements: [],
      commonTopics: [],
      readability: '0',
    }
  }
}

async function loadReadingRecommendations() {
  if (!userStore.userId) {
    return
  }

  try {
    const response = await getReadingRecommendations(userStore.userId)
    const payload = toRecord(response)
    const data = toRecord(payload.data)
    const recommendations = Array.isArray(data.recommendations) ? data.recommendations : []

    readingRecommendations.value = recommendations.map((item, index) => {
      const record = toRecord(item)
      return {
        id: toNumber(record.id, index + 1),
        title: toStringValue(record.title, '推荐文章'),
      }
    })
  } catch {
    readingRecommendations.value = []
  }
}

async function bootstrapProfile() {
  pageLoading.value = true

  try {
    await loadProfile()
    await Promise.allSettled([
      userStore.getSignStatusAction(),
      userStore.getUserStatsAction(),
      userStore.getActivitiesAction(),
      userStore.getRecommendedUsersAction(),
      userStore.getRecentArticlesAction(),
      loadWritingStyle(),
      loadReadingRecommendations(),
    ])
    loadDrafts()
    loadReadingHistory()
  } catch {
    ElMessage.error('个人中心加载失败，请稍后重试')
  } finally {
    pageLoading.value = false
  }
}

async function handleUpdateProfile() {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    await userStore.updateProfileAction({
      email: form.email,
      bio: form.bio,
    })
    ElMessage.success('资料保存成功')
  } catch {
    ElMessage.error('资料保存失败')
  }
}

async function handleChangePassword() {
  if (!passwordFormRef.value) {
    return
  }

  try {
    await passwordFormRef.value.validate()
  } catch {
    return
  }

  try {
    await userStore.changePasswordAction({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })

    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    ElMessage.success('密码更新成功')
  } catch {
    ElMessage.error('密码修改失败')
  }
}

function goToArticle(id: number) {
  router.push(`/article/${id}`)
}

function goToCreateArticle() {
  router.push('/create-article')
}

function goToEditArticle(id: number) {
  if (id > 1000000000000) {
    router.push({ path: '/create-article', query: { draftId: id } })
    return
  }

  router.push(`/edit-article/${id}`)
}

async function handleDeleteArticle(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这篇文章吗？删除后无法恢复。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await deleteArticleApi(id)
    await Promise.allSettled([
      userStore.getRecentArticlesAction(),
      userStore.getUserStatsAction(),
      userStore.getActivitiesAction(),
    ])
    ElMessage.success('文章已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

function deleteDraft(id: number) {
  void ElMessageBox.confirm('确定要删除这篇草稿吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    drafts.value = drafts.value.filter((draft) => draft.id !== id)
    localStorage.setItem('drafts', JSON.stringify(drafts.value))
    ElMessage.success('草稿已删除')
  }).catch(() => {})
}

function clearHistory() {
  void ElMessageBox.confirm('确定要清空全部阅读历史吗？', '清空确认', {
    confirmButtonText: '清空',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    readingHistory.value = []
    localStorage.removeItem('readingHistory')
    ElMessage.success('阅读历史已清空')
  }).catch(() => {})
}

async function handleNotifications() {
  try {
    await userStore.getNotificationsAction()
    notificationDialogVisible.value = true
  } catch {
    ElMessage.error('通知加载失败')
  }
}

async function markNotificationAsRead(id: number) {
  try {
    await userStore.markNotificationAsReadAction(id)
    ElMessage.success('已标记为已读')
  } catch {
    ElMessage.error('操作失败，请稍后重试')
  }
}

async function markAllNotificationsAsRead() {
  if (unreadNotificationCount.value === 0) {
    return
  }

  try {
    await userStore.markAllNotificationsAsReadAction()
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('批量已读失败，请稍后重试')
  }
}

async function handleNotificationIntentFromRoute() {
  if (route.query.openNotifications !== '1') {
    return
  }

  await handleNotifications()
  const nextQuery = { ...route.query }
  delete nextQuery.openNotifications
  await router.replace({
    path: route.path,
    query: nextQuery,
  })
}

async function handleSignIn() {
  try {
    await userStore.signInAction()
    await Promise.allSettled([
      userStore.getActivitiesAction(),
      userStore.getUserStatsAction(),
    ])
    ElMessage.success('签到成功')
  } catch {
    ElMessage.error('签到失败，请稍后重试')
  }
}

async function followUser(id: number) {
  try {
    await userStore.followUserAction(id)
    ElMessage.success('关注成功')
  } catch {
    ElMessage.error('关注失败，请稍后重试')
  }
}

async function handleLogout() {
  userStore.logout()
  ElMessage.success('已退出登录')
  await router.push('/login')
}

async function handleAvatarChange(uploadFile: UploadFile) {
  if (!uploadFile.raw) {
    return
  }

  try {
    const formData = new FormData()
    formData.append('avatar', uploadFile.raw)
    await userStore.uploadAvatarAction(formData)
    ElMessage.success('头像更新成功')
  } catch {
    ElMessage.error('头像上传失败')
  }
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const isAllowed = ['image/jpeg', 'image/png'].includes(rawFile.type)
  const isLt2M = rawFile.size / 1024 / 1024 < 2

  if (!isAllowed) {
    ElMessage.error('仅支持 JPG 或 PNG 格式')
  }

  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
  }

  return isAllowed && isLt2M
}

function triggerBgUpload() {
  bgFileInput.value?.click()
}

function handleBackgroundChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]

  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      backgroundImage.value = reader.result
      localStorage.setItem('profileBackground', reader.result)
      ElMessage.success('封面背景已更新')
    }
  }
  reader.readAsDataURL(file)

  if (target) {
    target.value = ''
  }
}

onMounted(() => {
  void bootstrapProfile()
  void handleNotificationIntentFromRoute()
})

watch(() => route.query.openNotifications, (value) => {
  if (value === '1') {
    void handleNotificationIntentFromRoute()
  }
})
</script>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  padding: 28px 24px 48px;
  background: 
    radial-gradient(circle at 10% 8%, rgba(111, 168, 153, 0.18), transparent 22%),
    radial-gradient(circle at 90% 10%, rgba(217, 191, 122, 0.18), transparent 24%),
    linear-gradient(180deg, var(--bg-main) 0%, var(--bg-muted) 50%, var(--bg-main) 100%),
    url('/images/4.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.profile-hero,
.page-shell {
  max-width: 1360px;
  margin: 0 auto;
}

.profile-hero {
  margin-bottom: 22px;
}

.hero-cover {
  position: relative;
  min-height: 240px;
  border-radius: 34px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  box-shadow: var(--shadow-strong);
}

.hero-cover::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(8, 16, 16, 0.12), transparent 34%),
    linear-gradient(180deg, transparent, rgba(16, 27, 25, 0.48));
}

.hero-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
  background-size: 68px 68px;
  mix-blend-mode: soft-light;
  opacity: 0.6;
}

.cover-upload {
  position: absolute;
  top: 18px;
  right: 18px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  color: #fff;
  background: rgba(17, 29, 29, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  transition: transform var(--transition-fast), background var(--transition-fast);
}

.cover-upload:hover {
  background: rgba(17, 29, 29, 0.5);
  transform: translateY(-1px);
}

.hero-panel {
  position: relative;
  margin: -56px 20px 0;
  padding: 28px;
  border-radius: 32px;
  background: var(--paper-strong);
  border: 1px solid var(--line-medium);
  box-shadow: var(--shadow-card);
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 22px;
}

.avatar-shell {
  position: relative;
  flex-shrink: 0;
}

.avatar-shell :deep(.el-upload) {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.45);
  box-shadow: 0 18px 34px rgba(17, 37, 33, 0.16);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-hover {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  background: rgba(18, 31, 31, 0.5);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.avatar-shell :deep(.el-upload):hover .avatar-hover {
  opacity: 1;
}

.avatar-ring {
  position: absolute;
  inset: -7px;
  border-radius: 38px;
  border: 1px solid rgba(186, 139, 44, 0.34);
  pointer-events: none;
}

.hero-copy {
  min-width: 0;
}

.hero-eyebrow,
.section-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-light);
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(2rem, 3vw, 2.8rem);
}

.hero-signature {
  margin: 10px 0 0;
  max-width: 720px;
  color: var(--text-main);
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--jade-800);
  background: rgba(63, 133, 118, 0.1);
  border: 1px solid rgba(63, 133, 118, 0.14);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 18px;
}

.action-button {
  min-width: 140px;
  height: 46px;
  border-radius: 16px;
}

.action-button.secondary {
  background: var(--bg-card);
  border: 1px solid var(--line-medium);
  color: var(--text-dark);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 24px;
}

.hero-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 22px;
  background: var(--bg-card);
  border: 1px solid var(--line-soft);
}

.hero-stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--jade-700);
  background: rgba(63, 133, 118, 0.1);
  font-size: 20px;
}

.hero-stat-value,
.dashboard-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-dark);
}

.hero-stat-label,
.dashboard-label {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-muted);
}

.page-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 22px;
  align-items: start;
}

.main-column,
.side-column {
  min-width: 0;
}

.section-nav {
  position: sticky;
  top: 16px;
  z-index: 4;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px;
  border-radius: 24px;
  background: var(--bg-card);
  backdrop-filter: blur(14px);
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-soft);
}

.nav-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 16px;
  border-radius: 14px;
  color: var(--text-main);
  background: transparent;
  transition:
    transform var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}

.nav-pill:hover {
  background: rgba(63, 133, 118, 0.08);
  transform: translateY(-1px);
}

.nav-pill.active {
  color: #fff;
  background: linear-gradient(135deg, var(--jade-700), var(--jade-500));
  box-shadow: 0 10px 24px rgba(37, 113, 98, 0.26);
}

.overview-grid,
.overview-insights,
.ai-grid {
  display: grid;
  gap: 18px;
}

.overview-grid {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
}

.overview-insights,
.ai-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 18px;
}

.section-card,
.side-card {
  border-radius: 30px;
  border: 1px solid var(--line-soft);
  background: var(--bg-card);
  box-shadow: var(--shadow-soft);
}

.section-card {
  padding: 24px;
}

.side-card {
  padding: 22px;
}

.side-card + .side-card {
  margin-top: 18px;
}

.section-card-header,
.side-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.section-card-header h2,
.side-card-header h3 {
  margin: 0;
}

.timeline-list {
  position: relative;
}

.timeline-list::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 9px;
  width: 1px;
  background: rgba(63, 133, 118, 0.16);
}

.timeline-item {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 0 0 18px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 4px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold-500), var(--jade-500));
  box-shadow: 0 0 0 6px rgba(63, 133, 118, 0.08);
}

.timeline-body {
  min-width: 0;
}

.timeline-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.timeline-type {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--jade-800);
  background: rgba(63, 133, 118, 0.1);
}

.timeline-meta time,
.compact-meta,
.panel-meta {
  color: var(--text-muted);
  font-size: 13px;
}

.timeline-body p,
.panel-summary,
.follow-copy p,
.chart-copy p,
.settings-block p,
.security-item p {
  margin: 0;
  color: var(--text-main);
}

.compact-list,
.panel-list,
.recommendation-list,
.follow-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.compact-item,
.panel-item,
.recommendation-item,
.quick-action {
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
}

.compact-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  padding: 16px 18px;
  border-radius: 20px;
  text-align: left;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.compact-item:hover,
.panel-item:hover,
.recommendation-item:hover,
.quick-action:hover {
  transform: translateY(-2px);
  border-color: rgba(63, 133, 118, 0.22);
}

.compact-item h3,
.chart-copy h3,
.settings-block h3,
.security-item h3,
.ai-panel h3 {
  margin: 0;
}

.compact-item p {
  margin: 8px 0 0;
  color: var(--text-muted);
}

.compact-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: right;
  flex-shrink: 0;
}

.insight-panel,
.checkin-card,
.growth-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.insight-row,
.checkin-row,
.growth-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.insight-label {
  color: var(--text-muted);
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.panel-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border-radius: 22px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.panel-main {
  min-width: 0;
  flex: 1;
}

.panel-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.title-button {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-dark);
  text-align: left;
}

.title-button:hover {
  color: var(--jade-700);
}

.panel-summary {
  margin-top: 10px;
}

.panel-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 12px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-card {
  padding: 20px;
  border-radius: 24px;
  text-align: center;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.dashboard-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 12px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--jade-700);
  background: rgba(63, 133, 118, 0.1);
}

.chart-panel {
  margin-top: 22px;
  padding: 22px;
  border-radius: 26px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.chart-copy {
  margin-bottom: 18px;
}

.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 20px;
}

.settings-block {
  padding: 22px;
  border-radius: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.settings-block p {
  margin-top: 8px;
  margin-bottom: 20px;
}

.settings-tip-card {
  padding: 22px;
  border-radius: 24px;
  color: var(--text-main);
  background:
    linear-gradient(180deg, rgba(39, 113, 98, 0.08), rgba(186, 139, 44, 0.08));
  border: 1px solid rgba(98, 113, 103, 0.12);
}

.tip-title {
  margin: 0 0 14px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-dark);
}

.settings-tip-card ul {
  margin: 0;
  padding-left: 18px;
}

.settings-tip-card li + li {
  margin-top: 10px;
}

.security-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.security-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-radius: 22px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.checkin-row .success {
  color: var(--jade-700);
}

.ai-panel {
  padding: 24px;
  border-radius: 28px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.analysis-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.analysis-item,
.analysis-block {
  padding: 16px 18px;
  border-radius: 20px;
  background: rgba(250, 245, 236, 0.74);
  border: 1px solid rgba(98, 113, 103, 0.08);
}

.analysis-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.analysis-item span,
.analysis-block p,
.meta-list dt,
.checkin-row span,
.growth-top span {
  color: var(--text-muted);
}

.analysis-block p {
  margin: 0 0 12px;
}

.meta-list {
  display: grid;
  gap: 16px;
}

.meta-list div {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 14px;
  border-bottom: 1px dashed rgba(98, 113, 103, 0.16);
}

.meta-list div:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.meta-list dd {
  margin: 0;
  color: var(--text-dark);
  word-break: break-all;
}

.full-button {
  width: 100%;
  height: 44px;
  border-radius: 16px;
}

.level-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border-radius: 999px;
  color: var(--jade-800);
  background: rgba(63, 133, 118, 0.1);
}

.progress-track {
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(63, 133, 118, 0.08);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--gold-500), var(--jade-500));
}

.growth-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.growth-tips p {
  margin: 0;
  color: var(--text-main);
}

.quick-actions {
  display: grid;
  gap: 12px;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  text-align: left;
  border-radius: 18px;
  color: var(--text-main);
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.quick-action.danger {
  color: var(--cinnabar-600);
}

.follow-item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.follow-avatar {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 18px;
}

.follow-copy {
  min-width: 0;
}

.follow-copy strong {
  display: block;
  color: var(--text-dark);
}

.follow-copy p {
  margin-top: 4px;
}

.notification-dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--text-muted);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.notification-item.unread {
  background: rgba(186, 139, 44, 0.1);
  border-color: rgba(186, 139, 44, 0.25);
}

.notification-copy {
  min-width: 0;
  flex: 1;
}

.notification-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.notification-type {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  color: var(--jade-800);
  background: rgba(63, 133, 118, 0.1);
}

.notification-copy p {
  margin: 0;
  color: var(--text-main);
}

.recommendation-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  width: 100%;
  padding: 15px 16px;
  text-align: left;
  border-radius: 18px;
  color: var(--text-main);
  background: var(--bg-elevated);
  border: 1px solid var(--line-soft);
}

.settings-tabs :deep(.el-tabs__header) {
  margin-bottom: 20px;
}

.settings-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.settings-tabs :deep(.el-tabs__item) {
  height: 40px;
  padding: 0 18px;
  border-radius: 999px;
  color: var(--text-main);
}

.settings-tabs :deep(.el-tabs__item.is-active) {
  color: var(--jade-700);
}

.settings-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--jade-600);
}

.profile-notify-dialog :deep(.el-dialog) {
  border-radius: 28px;
  overflow: hidden;
  background: var(--paper-strong);
}

.profile-notify-dialog :deep(.el-dialog__header) {
  padding: 22px 24px 0;
}

.profile-notify-dialog :deep(.el-dialog__body) {
  padding: 20px 24px 24px;
}

.theme-options {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 20px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 20px;
  background: var(--bg-card);
  border: 2px solid transparent;
  transition:
    transform var(--transition-fast),
    border-color var(--transition-fast),
    background var(--transition-fast);
  text-align: left;
}

.theme-option:hover {
  background: var(--bg-elevated);
  transform: translateY(-2px);
}

.theme-option.active {
  border-color: var(--jade-500);
  background: rgba(63, 133, 118, 0.08);
  box-shadow: 0 4px 20px rgba(63, 133, 118, 0.12);
}

.theme-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--gold-700);
  background: rgba(186, 139, 44, 0.1);
}

.theme-icon.dark-icon {
  color: var(--jade-600);
  background: rgba(63, 133, 118, 0.15);
}

.theme-icon.system-icon {
  color: var(--jade-700);
  background: rgba(63, 133, 118, 0.1);
}

.theme-option strong {
  display: block;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-dark);
}

.theme-option span {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.theme-preview {
  margin-top: 24px;
}

.preview-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.preview-card {
  padding: 22px;
  border-radius: 20px;
  background: var(--bg-card);
  border: 1px solid var(--line-medium);
  transition: all var(--transition-normal);
}

.preview-card.dark-preview {
  background: var(--paper-strong);
  border-color: var(--line-medium);
}

.preview-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-dark);
}

.preview-card.dark-preview .preview-title {
  color: var(--text-dark);
}

.preview-content {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--text-main);
}

.preview-card.dark-preview .preview-content {
  color: var(--text-muted);
}

@media (max-width: 1180px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .overview-grid,
  .overview-insights,
  .ai-grid,
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .hero-panel {
    margin: -44px 12px 0;
    padding: 22px;
  }

  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .hero-stats,
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-item,
  .security-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .panel-actions {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .profile-page {
    padding: 18px 14px 36px;
  }

  .hero-cover {
    min-height: 184px;
    border-radius: 26px;
  }

  .hero-panel {
    margin: -34px 8px 0;
    padding: 18px;
    border-radius: 24px;
  }

  .hero-stats,
  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .section-nav {
    top: 10px;
    padding: 10px;
    border-radius: 20px;
  }

  .nav-pill {
    flex: 1 1 calc(50% - 10px);
    justify-content: center;
  }

  .section-card,
  .side-card {
    padding: 18px;
    border-radius: 24px;
  }

  .compact-item,
  .notification-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .compact-meta,
  .notification-top {
    width: 100%;
    text-align: left;
  }

  .follow-item {
    grid-template-columns: 44px minmax(0, 1fr);
  }

  .follow-item :deep(.el-button) {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
