<script>
  import { Line } from 'vue-chartjs'

  export default Line.extend({
    props: ['height', 'data', 'labels'],
    mounted () {
      this.renderLineChart();
    },
    computed: {
      chartData: function() {
        return this.data
      }
    },
    methods: {
      renderLineChart () {
        this.renderChart(
        {
          labels: this.labels,
          datasets: [
          {
            label: 'Users',
            bbackgroundColor: 'rgba(255,255,255,.2)',
            borderColor: 'rgba(255,255,255,.55)',
            data: this.chartData
          }]
        }, {
          maintainAspectRatio: false,
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              gridLines: {
                color: 'transparent',
                zeroLineColor: 'transparent'
              },
              ticks: {
                fontSize: 2,
                fontColor: 'transparent'
              }
            }],
            yAxes: [{
              display: false,
              ticks: {
                display: false,
                min: Math.min.apply(Math, this.data) - 2,
                max: Math.max.apply(Math, this.data) + 2
              }
            }]
          },
          elements: {
            line: {
              borderWidth: 1
            },
            point: {
              radius: 4,
              hitRadius: 10,
              hoverRadius: 4
            }
          }
        })
      }
    },
    watch: {
      data: function() {
        this._chart.destroy();
        this.renderLineChart();
      }
    }
  })
</script>
