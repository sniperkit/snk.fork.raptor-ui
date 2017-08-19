import Vue from 'vue'
import Router from 'vue-router'

// Containers
import Full from '@/containers/Full'

// Views
import Dashboard from '@/views/Dashboard'
import Charts from '@/views/Charts'
import Widgets from '@/views/Widgets'

import UsersList from '@/views/user/user_list'
import UsersForm from '@/views/user/user_form'

// Views - Components
import Buttons from '@/views/components/Buttons'
import SocialButtons from '@/views/components/SocialButtons'
import Cards from '@/views/components/Cards'
import Forms from '@/views/components/Forms'
import Modals from '@/views/components/Modals'
import Switches from '@/views/components/Switches'
import Tables from '@/views/components/Tables'

// Views - Icons
import FontAwesome from '@/views/icons/FontAwesome'
import SimpleLineIcons from '@/views/icons/SimpleLineIcons'

// Views - Pages
import Page404 from '@/views/pages/Page404'
import Page500 from '@/views/pages/Page500'
import Login from '@/views/pages/Login'
import Register from '@/views/pages/Register'

Vue.use(Router)

const PATH_LOGIN = '/pages/login'

const router = new Router({
  mode: 'hash',
  linkActiveClass: 'open active',
  scrollBehavior: () => ({ y: 0 }),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
      name: 'Home',
      component: Full,
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: Dashboard
        },

        {
          path: 'charts',
          name: 'Charts',
          component: Charts
        },
        {
          path: 'widgets',
          name: 'Widgets',
          component: Widgets
        },

        {
          path: 'admin',
          redirect: '/admin/users',
          name: 'Admin',
          component: {
            render (c) { return c('router-view') }
          },
          children: [
            {
              path: 'users',
              name: 'Users',
              redirect: '/admin/users/list',
              component: {
                render (c) { return c('router-view') }
              },
              children: [
                {
                  path: 'list',
                  name: 'UsersList',
                  meta: {
                    label: 'List'
                  },
                  component: UsersList
                },
                {
                  path: 'create',
                  name: 'UsersCreate',
                  meta: {
                    label: 'Create'
                  },
                  component: UsersForm
                },
                {
                  path: ':userId',
                  component: UsersForm,
                  name: 'UsersUpdate',
                  meta: {
                    label: 'Update'
                  },
                  props: true
                }
              ]
            }
          ]
        },

        {
          path: 'components',
          redirect: '/components/buttons',
          name: 'Components',
          component: {
            render (c) { return c('router-view') }
          },
          children: [
            {
              path: 'buttons',
              name: 'Buttons',
              component: Buttons
            },
            {
              path: 'social-buttons',
              name: 'Social Buttons',
              component: SocialButtons
            },
            {
              path: 'cards',
              name: 'Cards',
              component: Cards
            },
            {
              path: 'forms',
              name: 'Forms',
              component: Forms
            },
            {
              path: 'modals',
              name: 'Modals',
              component: Modals
            },
            {
              path: 'switches',
              name: 'Switches',
              component: Switches
            },
            {
              path: 'tables',
              name: 'Tables',
              component: Tables
            }
          ]
        },
        {
          path: 'icons',
          redirect: '/icons/font-awesome',
          name: 'Icons',
          component: {
            render (c) { return c('router-view') }
          },
          children: [
            {
              path: 'font-awesome',
              name: 'Font Awesome',
              component: FontAwesome
            },
            {
              path: 'simple-line-icons',
              name: 'Simple Line Icons',
              component: SimpleLineIcons
            }
          ]
        }
      ]
    },

    {
      path: '/pages',
      redirect: '/pages',
      name: 'Pages',
      component: {
        render (c) { return c('router-view') }
      },
      children: [
        {
          path: '404',
          name: 'Page404',
          component: Page404
        },
        {
          path: '500',
          name: 'Page500',
          component: Page500
        },
        {
          path: 'login',
          name: 'Login',
          component: Login
        },
        {
          path: 'register',
          name: 'Register',
          component: Register
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  Vue.log.debug('accessing path %s', to.path)

  if (to.path === PATH_LOGIN) {
    Vue.log.debug('skip %s', PATH_LOGIN)
    return next()
  }

  Vue.log.debug('Checking login')

  Vue.raptor.Auth().login()
    .then((u) => {
      Vue.log.debug('Login ok')
      next()
    })
    .catch((e) => {
      Vue.log.debug('Login failed: %s', e.message)

      localStorage.raptor = '{}'
      next({
        path: PATH_LOGIN,
        query: {
          redirect: to.fullPath
        }
      })
    })
})

export default router