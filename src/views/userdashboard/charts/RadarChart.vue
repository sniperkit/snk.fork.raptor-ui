<script>
import { Radar } from 'vue-chartjs'
import moment from 'moment'

var currentDate = moment();

var colors = [
              'rgb(65,184,131)',
              'rgb(228,102,81)',
              'rgb(0,216,255)',
              'rgb(221,27,22)',
              'rgb(225,225,0)'
            ]
var colorsWithOpacity = [
    'rgba(65,184,131, 0.27)',
    'rgba(228,102,81, 0.27)',
    'rgba(0,216,255, 0.27)',
    'rgba(221,27,22, 0.27)',
    'rgb(225,225,0, 0.27)'
]

var monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default Radar.extend({
    props: ['height', 'chartData', 'width', 'searchData', 'dataPassed'],
    data() {
      return {
        dictUser: {},
        streamChartLabels: [],
        dataChartDevice: null,
        labels: [],
        device: null,
        channel: null,
        stream: null,
        dataForChart: [10, 39, 10, 40, 39, 0, 0],
        dictDevice: null,
        selectedStreamData: [],
        deviceDataTime: null,
        datasets: [],
        chartDatasets: [],
        // for slider
        selectedDisplayParam: null,
        fromDate: null,
        toDate: null,
        // records devices
        devices: [],
        channels: [],
      }
    },
    watch: {
      searchData: function(data) {
        this._chart.destroy()
        // console.log(data)
        this.selectedDisplayParam = this.dataPassed.display
        this.fromDate = this.dataPassed.fromDate
        this.toDate = this.dataPassed.toDate
        console.log(this.fromDate + "    " + this.toDate)
        this.searchDataForDates(this.fromDate, this.toDate)
      }
    },
    mounted () {
      // console.log(this.chartData)
      if( !(this.chartData instanceof Array) ) {
        this.device = this.chartData.device
        this.channel = this.chartData.channel
        this.stream = this.chartData.stream
        this.load()
      } else {
        this.loadDatasets()
      }
      // this.subscribeStream({name: this.stream, deviceId: this.device})
      this.renderRadarChart();
    },
    created() {
      document.addEventListener('beforeunload', this.handler)
    },
    methods: {
      handler (event) {
        if(this.datasets && this.datasets.length > 0) {
          for (var j = 0; j < this.datasets.length; j++) {
            if(this.datasets[j].stream) {
              this.unsubscribeStream(this.datasets[j].stream)
            }
          }
        } else {
          this.unsubscribeStream ({name: this.stream, deviceId: this.device});
        }
      },
      formatDate (d) {
        return moment(new Date(d)).format('MMMM Do YYYY');
      },
      renderRadarChart (datasets, lbls) {
        var context = this
        // if(!lbls) {
        //   lbls = this.channels
        // }
        // console.log(lbls)
        this.renderChart(
        {
          labels: lbls,
          datasets: datasets
        }, {
          // responsive: true,
          // maintainAspectRatio: false,
          legend: {
              display: true,
          },
          scale: {
            pointLabels: {
              fontSize: 0
            }
          },
          tooltips: {
            callbacks: {
              title: function(tooltipItem, data) {
                return data['labels'][tooltipItem[0]['index']];
              },
              label: function(tooltipItem, data) {
                let channel = (context.channel) ? context.channel : context.channels[tooltipItem['datasetIndex']]
                return channel + ': ' + data['datasets'][tooltipItem['datasetIndex']]['data'][tooltipItem['index']];
              },
              // afterLabel: function(tooltipItem, data) {
              //   return data['datasets'][0]['data'][tooltipItem['index']];
              // }
            },
            backgroundColor: '#FFF',
            titleFontSize: 13,
            titleFontColor: '#0066ff',
            bodyFontColor: '#000',
            bodyFontSize: 11,
            displayColors: false
          }
        })
      },
      load() {
        this.$raptor.Inventory().read(this.device)
        .then((device) => {
          // console.log(device)
          this.stream = device.getStream(this.stream)
          this.subscribeStream(this.stream);
          this.$emit('devicedata', device);
          // this.getStream("obd");
        })
        .catch((e) => {
          this.$log.debug('Failed to load device')
          this.$log.error(e)
          if(e.toString().indexOf("Unauthorized") !== -1) {
            this.$raptor.Auth().logout();
            this.$router.push("/pages/login");
          }
        })
      },
      // subscription / unsunscription of the data for the selected charts
      subscribeStream (stream) {
        var context = this;
        // var ts = Math.round((new Date()).getTime() / 1000);
        this.$raptor.Stream().list(stream, 0, 100, 'timestamp,desc')//list(stream, 0, ts)
        .then((streams) => {
          // console.log(streams)
          // context.selectedStreamData = streams
          // context.extractChartDataDeviceStream(context.selectedStreamData,context.channel);
          streams.sort(function(a, b) {
            return a.timestamp - b.timestamp;
          });
          context.selectedStreamData = streams
          this.dataForChart = [];
          this.streamChartLabels = []
          let obj = context.extractChartDataDeviceStream(context.selectedStreamData,context.channel);
          this.dataForChart = obj.data
          this.streamChartLabels = obj.labels
          this.populateChart(this.streamChartLabels, [this.channel], this.dataForChart)
        })
        .catch((e) => {
          this.$log.debug('Failed to load streams')
          this.$log.error(e)
          if(e.toString().indexOf("Unauthorized") !== -1) {
            this.$raptor.Auth().logout();
            this.$router.push("/pages/login");
          }
        })
        this.$raptor.Stream().subscribe(stream, function(msg) {
          // console.log(msg)
          if((context._chart || context._chart != undefined || context._chart != null) && context._chart.ctx != null) {
            let last = context.selectedStreamData[context.selectedStreamData.length-1]
            if(last.timestamp != msg.record.timestamp && last.deviceId == msg.record.deviceId) {
              context.selectedStreamData.push(msg.record);
              if(context.selectedStreamData.length > 100) {
                context.selectedStreamData.shift()
              }
              context.dataForChart = [];
              context.streamChartLabels = []
              context.selectedStreamData.push(msg.record);
              let obj = context.extractChartDataDeviceStream(context.selectedStreamData,context.channel);
              context.dataForChart = obj.data
              context.streamChartLabels = obj.labels
              context.populateChart(context.streamChartLabels, [context.channel], context.dataForChart)
            }
          }
        });
        // context.unsubscribeStream(stream)
      },
      unsubscribeStream (stream) {
        var context = this;
        this.$raptor.Stream().unsubscribe(stream, function(msg) {
          // console.log(msg)
        });
      },
      getDate(s, val) {
        let sDate = (new Date(s.timestamp * 1000)).getMinutes();
        if(val == 'hours'){
          sDate = (new Date(s.timestamp * 1000)).getHours();
        } else if(val == 'day'){
          sDate = (new Date(s.timestamp * 1000)).getDay();
        } else if(val == 'month'){
          sDate = (new Date(s.timestamp * 1000)).getMonth();
        }
        return sDate;
      },
      extractChartDataDeviceStream (d, channel, pushData) {
        let dataForChart = [];
        let streamChartLabels = []
        for (var i = 0; i < d.length; i++) {
          let s = d[i];
          let sDate = (new Date(s.timestamp * 1000)).toUTCString();
          if((typeof s.channels[channel]) === 'number' || (typeof s.channels[channel]) === 'boolean' || (!isNaN(s.channels[channel] * 1))) {
            streamChartLabels.push(sDate)
            dataForChart.push(s.channels[channel])
          }
        }
        let labels = streamChartLabels.filter(function(elem, index, self) {
          return index == self.indexOf(elem);
        })

        return { labels: labels, data: dataForChart }
      },
      populateChart(labels, lbl, dataForChart) {
        let dataset = []
        for (var i = 0; i < lbl.length; i++) {
          // lbl[i]
          dataset.push({
            label: lbl,
            backgroundColor: colorsWithOpacity[i],
            borderColor: colors[i],
            pointBackgroundColor: colors[i],
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: colors[i],
            data: dataForChart
          })
        }
        // console.log(dataset)
        this._chart.destroy();
        this.renderRadarChart(dataset, labels);
      },
      // for multiple datasets
      loadDatasets() {
        this.receivedData = 0
        this.devices = []
        for (var i = 0; i < this.chartData.length; i++) {
          this.$raptor.Inventory().read(this.chartData[i].device)
          .then((device) => {
            // console.log(device)
            for (var j = 0; j < this.chartData.length; j++) {
              if(this.chartData[j].device.id == device.id) {
                this.channels.push(this.chartData[j].channel)
                let dev = {
                  device: device,
                  stream: device.getStream(this.chartData[j].stream),
                  channel: this.chartData[j].channel,
                  pushed: false
                }
                if(!this.checkDatasetExist(dev)) {
                  this.datasets.push(dev)
                  this.devices.push(device)
                  if(dev.stream) {
                    this.subscribeDatasetStreams(dev.stream);
                  }
                  if(this.devices.length == this.chartData.length) {
                    this.$emit('devicedata', this.devices);
                    this.devices = []
                  }
                }
              }
            }
            // console.log(this.devices)
            if(this.devices.length == this.chartData.length) {
              this.$emit('devicedata', this.devices);
            }
            // this.getStream("obd");
          })
          .catch((e) => {
            this.$log.debug('Failed to load device')
            this.$log.error(e)
            // this.loading = false
            if(e.toString().indexOf("Unauthorized") !== -1) {
              this.$raptor.Auth().logout();
              this.$router.push("/pages/login");
            }
          })
        }
      },
      checkDatasetExist(dev) {
        let exist = false
        // console.log(dev)
        for (var k = 0; k < this.datasets.length; k++) {
          // console.log(this.datasets[k])
          if(this.datasets[k].device.id == dev.device.id && this.datasets[k].stream.name == dev.stream.name && dev.channel == this.datasets[k].channel) {
            exist = true
          }
        }
        return exist
      },
      subscribeDatasetStreams (stream) {
        this.$raptor.Stream().list(stream, 0, 100, 'timestamp,desc')
        .then((streams) => {
          // console.log(streams)
          if(streams.length > 0) {
            for (var j = 0; j < this.datasets.length; j++) {
              if(this.datasets[j].device.id == streams[0].json.deviceId) {
                streams.sort(function(a, b) {
                  return a.timestamp - b.timestamp;
                });
                this.datasets[j].selectedStreamData = streams
                let obj = this.extractChartDataDeviceStream(streams,this.datasets[j].channel, this.selectedDisplayParam);
                this.datasets[j].dataForChart = obj.data
                this.datasets[j].streamChartLabels = obj.labels
                this.streamChartLabels = obj.labels
                if(this.receivedData == 0) {
                  this.datasets[j].pushed = true
                  this.createChart(this.datasets[j], this.streamChartLabels)
                  this.subsciptionOfStreamForMultipleData(this.datasets[j].stream)
                } else {
                  if(!this.datasets[j].pushed) {
                    this.datasets[j].pushed = true
                    this.pushNewDataStreamInChart(this.datasets[j])
                    this.subsciptionOfStreamForMultipleData(this.datasets[j].stream)
                  }
                }
                this.receivedData++
              }
            }
          }
        })
        .catch((e) => {
          this.$log.debug('Failed to load streams')
          // this.$log.error(e)
          // this.loading = false
          if(e.toString().indexOf("Unauthorized") !== -1) {
            this.$raptor.Auth().logout();
            this.$router.push("/pages/login");
          }
        })
      },
      createChart(data, labels) {
        let dsets = []
        this.chartDatasets = [{
            label: data.channel,
            // fill: false,
            borderColor: colors[0],
            backgroundColor: colorsWithOpacity[0],
            strokeColor: 'rgba(220,180,0,1)',
            pointColor: 'rgba(220,180,0,1)',
            data: data.dataForChart
          }]
        this.streamChartLabels = labels.filter(function(elem, index, self) {
          return index == self.indexOf(elem);
        })
        if((this._chart || this._chart != undefined || this._chart != null) && this._chart.ctx != null) {
          // this._chart.data.datasets = this.chartDatasets
          // this._chart.data.labels = this.streamChartLabels
          // this._chart.update()
          this._chart.destroy()
          // console.log(this.chartDatasets)
          this.renderRadarChart(this.chartDatasets, this.streamChartLabels);
        }
      },
      pushNewDataStreamInChart(data) {
        if((this._chart || this._chart != undefined || this._chart != null) && this._chart.ctx != null) {
          let index = this._chart.data.datasets.length
          this._chart.data.datasets.push({
            label: data.channel,
            // fill: false,
            borderColor: colors[index],
            backgroundColor: colorsWithOpacity[index],
            strokeColor: 'rgba(220,180,0,1)',
            pointColor: 'rgba(220,180,0,1)',
            data: data.dataForChart
          })
          this._chart.update()
        }
      },
      //subscription
      subsciptionOfStreamForMultipleData(stream) {
        var context = this;
        this.$raptor.Stream().subscribe(stream, function(msg) {
          // console.log(msg)
          if((context._chart || context._chart != undefined || context._chart != null) && context._chart.ctx != null) {
            let dsets = []
            for (var j = 0; j < context.datasets.length; j++) {
              let last = context.datasets[j].selectedStreamData[context.datasets[j].selectedStreamData.length-1]
              if(context.datasets[j].device.id == msg.device.id && last.timestamp != msg.record.timestamp) {
                  context.datasets[j].selectedStreamData.push(msg.record)
                  if(context.datasets[j].selectedStreamData.length > 100) {
                    context.datasets[j].selectedStreamData.shift()
                  }
                  let obj = context.extractChartDataDeviceStream(context.datasets[j].selectedStreamData,context.datasets[j].channel,context.selectedDisplayParam);
                  context.datasets[j].dataForChart = [];
                  context.datasets[j].streamChartLabels = []
                  context.datasets[j].dataForChart = obj.data
                  context.datasets[j].streamChartLabels = obj.labels
                  context.streamChartLabels = obj.labels
                  // console.log(context._chart.data)
                  context._chart.data.datasets[j] = {
                    label: context.datasets[j].channel,
                    borderColor: colors[j],
                    backgroundColor: colorsWithOpacity[j],
                    data: context.datasets[j].dataForChart
                  }
                  context._chart.data.labels = context.streamChartLabels
                  context._chart.update()
              }
            }
            // if(!(msg.type === 'stream' && msg.op === 'data' && msg.streamId === this.$raptor.stream)) {
            //   return
            // }
          }
        });
      },

      // search data based on timestamp for device
      searchDataForDates (startDate, endDate) {
        if(startDate == undefined || startDate == null ) {
          startDate = 0
        } else {
          // startDate = startDate+':00'
          startDate = moment(startDate).format('x');
        }
        if(endDate == undefined || endDate == null) {
          endDate = currentDate.format('x')
        } else {
          // endDate = endDate+':00'
          endDate = moment(endDate).format('x');
        }
        // "timestamp":{"between":[1510152092358,1510152094358]}
        let pageNumber = 0
        this.selectedStreamData = []
          let query = {timestamp: {between:[startDate, endDate]}, page:pageNumber, size:500,sort:"createdAt,DESC"}
          // console.log(query)
          // console.log(stream)
          this.loopOverStreamPagination (this.stream, query, pageNumber, startDate, endDate)
      },
      searchDataApi(stream, query, callback) {
        // console.log(query)
        // console.log(stream)
        this.$raptor.Stream().search(stream, query)
        .then((stream) => {
          // console.log(stream.length)
          callback(stream)
        })
        .catch((e) => {
          this.$log.debug('Failed to load device')
          if(e.toString().indexOf("Unauthorized") !== -1) {
            this.$raptor.Auth().logout();
            this.$router.push("/pages/login");
          }
        })
      },
      loopOverStreamPagination (stream, query, pageNumber, startDate, endDate) {
        let context = this
        this.searchDataApi(stream, query, function (streams) {
          // console.log(streams[0])
          // console.log(streams[0].timestamp * 1000)
          // console.log(endDate)
          // console.log((streams[0].timestamp * 1000) > endDate)
          if(streams.length > 0 && (streams[0].timestamp * 1000) < endDate) {
            for (var i = 0; i < streams.length; i++) {
              context.selectedStreamData.push(streams[i])
            }
            pageNumber = pageNumber + 1
            let query = {timestamp: {between:[startDate, endDate]}, page:pageNumber, size:500,sort:"createdAt,DESC"}
            context.loopOverStreamPagination(stream, query, pageNumber, startDate, endDate)
          } else {
            for (var i = 0; i < streams.length; i++) {
              context.selectedStreamData.push(streams[i])
            }
            // console.log(context.selectedStreamData)
            context.dataForChart = [];
            context.streamChartLabels = []
            let obj = context.extractChartDataDeviceStream(context.selectedStreamData,context.channel, context.selectedDisplayParam);
            context.dataForChart = obj.data
            context.streamChartLabels = obj.labels
            context.populateChart(context.streamChartLabels, [context.channel], context.dataForChart)
          }
        })
      },
    },
})
</script>
