<template>
<div class="animated fadeIn row row-fluid">
  <div class="col-lg-12">

    <b-card>

      <div slot="header">

        <div class="row row-fluid">
          <div class="col-lg-8 list-inline">
            <h3 class="list-inline-item">Applications</h3>
            <b-button class="list-inline-item" variant="primary" :to="{ name: 'AppCreate'}">
              <i class="fa fa-plus"></i> New
            </b-button>
          </div>
          <div class="col-md-4 text-right">
            <b-form-fieldset description="Items per page" label="Show" horizontal>
              <b-form-select :options="pageOptions" v-model="perPage" @change="itemsLimitChange"/>
            </b-form-fieldset>
          </div>
        </div>

      </div>

      <b-table no-local-sorting small responsive show-empty :items="list" :fields="fields" @sort-changed="sortingChanged">
        
        <template slot="id" scope="row">
          <b-badge size="sm" variant="light" :to="{ name: 'AppUpdate', params: { appId: row.item.id }}">{{row.item.id}}</b-badge>
        </template>
        <template slot="name" scope="row">
          <b-button variant="link" :to="{ name: 'AppUpdate', params: { appId: row.item.id }}">
            {{row.item.name}}
          </b-button>
        </template>
        <template slot="userId" scope="row">
          <b-badge size="sm" variant="light">{{row.item.userId}}</b-badge>
        </template>
        <template slot="roles" scope="row">
            <b-badge v-for="role in row.item.roles" :key="role.name" :variant="role.name === 'admin' ? 'info' : 'light'">
                {{ role.name }}
            </b-badge>
        </template>
        <template slot="status" scope="row">
            <b-badge :variant="row.item.enabled ? 'success' : 'warning'">{{row.item.enabled ? 'Enabled' : 'Disabled'}}</b-badge>
        </template>
        <template slot="actions" scope="row">
            <b-button title="Delete application" variant="danger" @click="remove(row.item)">
              <i class="fa fa-remove fa-lg"></i>
            </b-button>
            <b-button title="View users" variant="success" :to="{ name: 'UsersListApp', params: { appId: row.item.id }}">
              <i class="fa fa-users fa-lg"></i>
            </b-button>
            <b-button title="View devices" variant="success" :to="{ name: 'DeviceListApp', params: { id: row.item.id }}">
              <i class="fa fa-mobile fa-lg"></i>
            </b-button>
        </template>
      </b-table>
      
      <div>
        <b-pagination align="center" :total-rows="totalRows" :per-page="perPage" v-model="currentPage" prev-text="Prev" next-text="Next" @change="pageChanged" />
      </div>

    </b-card>
  </div>
  <!--/.col-->

</div>
<!--/.row-->
</template>

<script>
import moment from 'moment'

export default {
  name: 'app_list',
  data() {
    return {
      loading: false,
      pager: null,
      list: [],
      error: null,
      currentPage: 1,
      fields: {
        id: {
          label: 'Id',
          sortable: true,
        },
        name: {
          label: 'Name',
          sortable: true,
        },
        userId: {
          label: 'User Id',
        },
        roles: {
          label: 'Roles',
          sortable: true,
        },
        status: {
          label: 'Status'
        },
        actions: {}
      },
      perPage: 25,
      totalRows: 0,
      appId: null,
      sortBy: "created",
      sortDir: "desc",
      pageOptions: [25,100,250]
    }
  },
  mounted() {
    // this.app = this.$raptor.Auth().getUser()
    this.fetchData()
  },
  methods: {
    formatDate(d) {
      return moment(new Date(d)).format('MMMM Do YYYY')
    },
    fetchData() {
      var context = this
      this.error = null
      this.loading = true
      this.$log.debug('Fetching app list')
      // page config
      let page = {
        page: this.currentPage,
        size: this.perPage,
        sort: this.sortBy,
        sortDir: this.sortDir,
      }
      console.log(page)
      this.$raptor.App().list(page).then((pager) => {

        this.$log.debug('Loaded %s app list', pager.getContent().length)

        this.loading = false
        this.pager = pager
        this.list = pager.getContent()
        this.totalRows = pager.getTotalElements()

      }).catch(function(e) {
        context.$log.warn(e)
        if (e.code === 401) {
          context.$raptor.Auth().logout();
          context.$router.push("/pages/login");
        }
      })

    },
    pageChanged(page) {
      this.currentPage = page
      this.fetchData()
    },
    sortingChanged(ev) {
      this.sortBy = ev.sortBy
      this.sortDir = ev.sortDesc ? 'desc' : 'asc'
      this.fetchData()
    },
    itemsLimitChange(limit) {
      console.log(limit)
      this.currentPage = 0
      this.perPage = limit
      this.fetchData()
    },
    remove(app) {
      const appName = app && app.name ? app.name : app
      const appId = app && app.id ? app.id : app
      var context = this
      return this.$dialog.confirm(`Remove app \`${appName}\` ?`, {
          html: false,
          okText: 'Remove',
          cancelText: 'Cancel',
        })
        .then(() => {
          this.$log.debug("Deleting %s", appId)
          this.$raptor.App().delete(appId)
            .then(() => {
              this.$log.debug("Deleted %s", appId)
              this.fetchData()
            })
        }).catch(function(e) {
          context.$log.error(e)
          context.$log.warn(e)
          if (e.code === 401) {
            context.$raptor.Auth().logout();
            context.$router.push("/pages/login");
          }
        })
    },
  }

}
</script>
