import React from 'react';
import L from 'leaflet';
import { Select, Switch } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import * as moment from 'moment'
import { max, range, maxBy } from 'lodash'
import * as d3 from 'd3'
import * as cx from 'classnames'
import Chart from 'chart.js';
import { default as C3Chart} from 'react-c3-component';
import 'c3/c3.css';

import './App.scss';
import styles from './app.module.scss';

// import ScatterPlot from './components/ScatterPlot/ScatterPlot';
const {Option} = Select;
// const covidData = require('./covid19US.json');
// const chartData = require('./covid19UStime.json');
const countiesJson = require('./gz_2010_us_050_00_5m.json');


//function getCasesColor(d, type) {
//  if (type === '100k') {
//    return d >= 1000 ? '#045a8d' : d >= 500 ? '#2b8cbe' : d >= 100 ? '#74a9cf' : d >= 10 ? '#a6bddb' : d >= 1 ? '#d0d1e6' : '#f1eef6';
//  }
//
//  return d > 5000 ? '#045a8d' : d > 500 ? '#2b8cbe' : d > 100 ? '#74a9cf' : d > 10 ? '#a6bddb' : d > 1 ? '#d0d1e6' : '#f1eef6';
//}

//function casesColorThreshold(d, type) {
//  if (type === '100k') {
//    return d3.scaleThreshold().domain([0, 1, 10, 100, 500, 1000])
//  }
//}

//function getDeathsColor(d, type) {
//  if (type === '100k') {
//    return d >= 75 ? '#252525' : d >= 50 ? '#636363' : d >= 25 ? '#969696' : d >= 10 ? '#bdbdbd' : d >= 1 ? '#d9d9d9' : '#f7f7f7';
//  }
//
//  return d > 100 ? '#252525' : d > 50 ? '#636363' : d > 10 ? '#969696' : d > 5 ? '#bdbdbd' : d > 1 ? '#d9d9d9' : '#f7f7f7';
//}

function numberWithCommas(x) {

  if (!x && x!==0) {
    return 'No data';
  }

  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function parseDate(date) {
  const m = moment(date, 'YYYY-MM-DD')

  if (m) {
    return m.format('MMMM DD, YYYY')
  }

  return 'N/A'
}

const colorDomains = {
  cases100k: [10, 50, 75, 100,300],
  casesCount: [1,10, 100,500,5000],
  deaths100k: [1,5,10,50],
  deathsCount: [1,10, 50,100]
}

export default class App extends React.Component {
  state = {counties: [], currentCounty: null, target: 'cases', calcType: 'count'};
  geoJSON;
  legend;
  chart;

  componentDidMount() {
    const { covidData, chartData } = this.props;

    this.map = L.map('map', {
      center: [38.8, -98],
      zoom: 4,
    });

    this.colorScale = {
      cases: {
        '100k': d3.scaleThreshold().domain(colorDomains.cases100k).range(d3.schemeBlues[6]),
        count: d3.scaleThreshold().domain(colorDomains.casesCount).range(d3.schemeBlues[6])
      },
      deaths: {
        '100k': d3.scaleThreshold().domain(colorDomains.deaths100k).range(d3.schemeGreys[5]),
        count: d3.scaleThreshold().domain(colorDomains.deathsCount).range(d3.schemeGreys[5])
      }
    }

    const maxValues = covidData.map(d => {
      return [
        (d.confirmed_cum/d.POPESTIMATE2019) * 100000,
        (d.deaths_cum/d.POPESTIMATE2019) * 100000
      ]
    });

    const maxConfirmed = max(maxValues.map(d => {
      if (isNaN(d[0]) || !isFinite(d[0])) {
        return 0;
      }

      return d[0]
    }));

    const maxDeaths = max(maxValues.map(d => {
      if (isNaN(d[1]) || !isFinite(d[1])) {
        return 0;
      }

      return d[1]
    }));

    const power = value => Math.pow(10, parseInt(String(Math.round(value)).length) - 1);
    const roundedMax = {
      confirmed: Math.ceil(maxConfirmed / power(maxConfirmed)) * power(maxConfirmed),
      death: Math.ceil(maxDeaths / power(maxDeaths)) * power(maxDeaths)
    };

    this.map.createPane('labels');
    this.map.getPane('labels').style.zIndex = 650;
    this.map.getPane('labels').style.pointerEvents = 'none';

    const counties = countiesJson.features.filter(
      item => covidData.find(covidItem => item.properties.NAME === covidItem.cnty_name)
    );

    if (window.matchMedia('(max-width: 768px)').matches) this.setState({ mobile: true }, () => this.map.zoomOut(1));

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png', {
      maxZoom: 10,
    }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      maxZoom: 10,
      pane: 'labels'
    }).addTo(this.map);


    this.geoJSON = L.geoJSON(counties, {
      style: this.style, onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: this.highlightFeature,
          mouseout: this.resetHighlight,
          click: this.zoomToFeature
        })
      }
    }).addTo(this.map);

    this.addInfo();
    this.addLegend();
    this.drawChart();
  };

  componentDidUpdate(prevProps, prevState) {
    const { currentCounty, target } = this.state;
    if (prevState.currentCounty === currentCounty && prevState.target === target) return;
    this.drawChart();
  }

  drawChart() {
    const { currentCounty, currentStateCode, target } = this.state;
    const { chartData } = this.props;

    if (!currentCounty || !currentStateCode) return;
    const currentCountyChartData = chartData.filter(item => item.Areaname === `${currentCounty}, ${currentStateCode}`);
    let barChart = {
      x: 'x',
      columns: [
        ['x'],
        ['d1'],
      ],
      colors: {
        d1: (target === 'cases' && '#6da6f7') || '#6c757d',
      },
      type: 'bar',
      order: 'asc',
      names: {
        d1: (target === 'cases' && 'New cases') || 'Deaths',
      },
      groups: [
        ['d1', 'd2']
      ]};
    currentCountyChartData.filter(item => !!item.confirmed_cum).forEach(d => {
      barChart.columns[0].push(d.Date);
      barChart.columns[1].push(target === 'cases' ? +d.confirmed_new : +d.deaths_new);
    });

    this.setState({ barChartData: barChart });
  }

  addInfo() {
    this.info = L.control();

    this.info.onAdd = () => {
      this._div = L.DomUtil.create('div', 'info');
      this.info.update();
      return this._div;
    };

    this.info.update = props => {
      if (!props) {
        this._div.innerHTML = 'Hover over a county';
        return
      }

      const confirmedLabels = {
        count: 'Confirmed Cases:',
        '100k': 'Confirmed Cases per 100k:'
      }

      const deathLabels = {
        count: 'Deaths:',
        '100k': 'Deaths per 100k:'
      }

      const confirmed = this.state.calcType === 'count'
        ? props.confirmed_cum
        : numberWithCommas(this.calc100k(props, 'confirmed_cum'))

      const deaths = this.state.calcType === 'count'
        ? props.deaths_cum
        : numberWithCommas(this.calc100k(props, 'deaths_cum'))
      this._div.innerHTML = `
        <div><b>${props.cnty_name}, ${props.st}</b></div>
        <div>${confirmedLabels[this.state.calcType]} <b>${confirmed}</b></div>
        <div>${deathLabels[this.state.calcType]} <b>${deaths}</b></div>
      `;
    };

    this.info.addTo(this.map);
  }

  addLegend() {
    const legend = L.control({position: 'bottomright'});

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'info legend');

      // let grades = this.state.target === 'cases' ? [0, 1, 10, 100, 500, 5000] : [0, 1, 5, 10, 50, 100];

      // if (this.state.calcType === '100k') {
      //   grades = this.state.target === 'cases' ? [0, 1, 10, 100, 500, 1000] : [0, 1, 10, 25, 50, 75];
      // }

      const grades = this.colorScale[this.state.target][this.state.calcType].domain();

      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          `<i style="background:${this.colorScale[this.state.target][this.state.calcType](grades[i] + 1)}"></i>
            ${grades[i] === 0 ? `${grades[i]}<br>` : grades[i + 1] ? `${grades[i]}&ndash;${grades[i + 1]}<br>` : `${grades[i]}+`}`;
      }

      return div;
    };
    this.legend = legend;

    legend.addTo(this.map);
  }

  style = feature => {
    const { calcType, target } = this.state;
    const { covidData } = this.props;

    const fill = covidData.find(item => item.cnty_name === feature.properties.NAME && item.stateID === feature.properties.STATE);

    let fillColor = this.state.target=== 'cases'
        ? this.colorScale[target][calcType]((fill && fill.confirmed_cum) || 0)
        : this.colorScale[target][calcType]((fill && fill.deaths_cum) || 0)


    if (this.state.calcType === '100k' && fill) {
//      fillColor = this.colorScale[target][calcType]((fill && fill.confirmed_cum) || 0)

      fillColor = this.state.target === 'cases'
        ? this.colorScale[target][calcType](this.parse100k(fill, 'confirmed_cum'))
        : this.colorScale[target][calcType](this.parse100k(fill, 'deaths_cum'));
    }

    return {
      fillColor: fillColor,
      weight: 1,
      opacity: 1,
      color: 'white',
      dashArray: '4',
      fillOpacity: 0.9
    };
  };

  highlightFeature = e => {
    const { covidData } = this.props;

    const layer = e.target;
    this.info.update(covidData.find(data => data.cnty_name === e.target.feature.properties.NAME && data.stateID === e.target.feature.properties.STATE));

    layer.setStyle({
      weight: 2,
      color: '#065794',
      dashArray: '',
      fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  };

  zoomToFeature = e => {
    const { covidData } = this.props;

    const state = covidData.find(data => data.stateID === e.target.feature.properties.STATE);
    const stateString = state ? state.st : '';

    this.handleChange({value: e.target._leaflet_id, label: [e.target.feature.properties.NAME, ", ", stateString]});
  };

  resetHighlight = e => {
    if (this.state.value && +this.state.value.value === e.target._leaflet_id) return;
    this.geoJSON.resetStyle(e.target);
    this.info.update();
  };

  onSearch = value => {
    const layers = [...Object.values(this.map._layers)]
      .filter(county => county.feature && (new RegExp(value.toLowerCase())).test(county.feature.properties.NAME.toLowerCase()));
    if (!layers.length) return this.setState({counties: []});
    this.setState({counties: [...layers]})
  };

  handleSearch = value => {
    if (value) {
      this.onSearch(value);
    } else {
      this.setState({counties: []});
    }
  };

  handleChange = value => {
    const layers = [...Object.values(this.map._layers)];
    const layer = layers.find(layer => layer._leaflet_id === +value.value);
    const previousLayer = this.state.value && layers.find(layer => layer._leaflet_id === +this.state.value.value);
    if (previousLayer) {
      previousLayer.setStyle({
        weight: 1,
        color: 'white',
        dashArray: '4',
        fillOpacity: 0.9
      });
    }
    this.map.flyToBounds(layer._bounds, { easeLinearity: 1, duration: 1 });
    layer.setStyle({
      weight: 3,
      color: '#065794',
      dashArray: '',
      fillOpacity: 0.9
    });
    this.setState({value, currentCounty: value.label[0], currentStateCode: value.label[2], currentLayer: layer});
  };

  onSelectTarget = value => {
    this.setState({target: (value && 'cases') || 'deaths'}, () => {
      this.geoJSON.setStyle(this.style);
      this.legend && this.legend.remove() && this.addLegend();
      this.state.currentLayer && this.state.currentLayer.setStyle({
        weight: 3,
        color: (value && '#065794') || '#252525',
        dashArray: '',
        fillOpacity: 0.9
      });
    })
  };

  onSelectCalcType = value => {
    this.setState({calcType: value ? 'count' : '100k'}, () => {
      this.geoJSON.setStyle(this.style);
      this.legend && this.legend.remove() && this.addLegend();
      this.state.currentLayer && this.state.currentLayer.setStyle({
        weight: 3,
        color: (value && '#065794') || '#252525',
        dashArray: '',
        fillOpacity: 0.9
      });
    })
  }

  onPlotClicked = (value) => {
    const layers = [...Object.values(this.map._layers)];
    const layer = layers.find(d => {
      return d.feature && d.feature.properties.STATE == String(value.stateID) && d.feature.properties.COUNTY == String(value.countyID)
    })

    if (!layer) {
      console.error('Layer not found!')
      return
    }

    this.map.flyToBounds(layer._bounds, { easeLinearity: 1, duration: 1 });
    this.setState({value, currentCounty: value.cnty_name, currentStateCode: value.st, currentLayer: layer});
  }

  parse100k(data, key) {
            return ((data[key] / data.POPESTIMATE2019) * 100000)
  }

  calc100k(data, key) {
    return Math.round(this.parse100k(data, key))
  }

  render() {
    const {counties, currentCounty, value, currentStateCode, target, calcType, barChartData} = this.state;
    const { covidData } = this.props;

    const options = counties.map(county => {
        const stateString = covidData.find(data => data.stateID === county.feature.properties.STATE);
        return (
          <Option key={county._leaflet_id}>
            {county.feature.properties.NAME},&nbsp;
            {stateString ? stateString.st : ''}
          </Option>)
    });
    const currentCountyData = currentCounty && covidData.find(county => county.cnty_name === currentCounty && county.st === currentStateCode);

    return (
      <div className={styles.app}>
        <div className={styles.header}>
          <h1>COVID-19 IN U.S. COUNTIES</h1>
          <p>Search for a county or select one from the map to view number of COVID-19 cases, deaths, hospital and demographic information</p>
        </div>

        <div className={styles.wrapper}>
          <div className={styles.infoBlock}>
            <div className={styles.searchBlock}>
              <SearchOutlined/>
              <Select
                labelInValue
                showSearch
                value={value}
                placeholder='Type county name'
                size="large"
                style={{width: 200}}
                defaultActiveFirstOption={false}
                showArrow={false}
                filterOption={false}
                onSearch={this.handleSearch}
                onChange={this.handleChange}
                notFoundContent={null}
              >
                {options}
              </Select>
            </div>
            <div className={styles.switch}>
              <div className="d-flex flex-grow-1">
                <div className="d-flex flex-grow-1">
                  <Switch
                    className="caseType"
                    checkedChildren="Cases"
                    unCheckedChildren="Deaths"
                    defaultChecked
                    onChange={this.onSelectTarget}
                  />
                </div>
                <div className="d-flex">
                  <Switch
                    className="calcType"
                    checkedChildren="Counts"
                    unCheckedChildren="per 100k"
                    defaultChecked
                    onChange={this.onSelectCalcType}
                  />
                </div>
              </div>
            </div>
            {currentCountyData && (
              <div className={styles.countyInfo}>
                <div className={styles.stateName}>{currentCountyData.cnty_name}, {currentCountyData.st}</div>
                <div className={styles.updatedAt}>As of {parseDate(currentCountyData.Date)}</div>
                <div className={styles.infoBlockHeader}>Confirmed Cases*</div>
                <div className={styles.infoHead}>
                  <span
                    className={cx({[styles.underlined]: target === 'cases' && calcType === 'count'})}
                  >
                    Counts:
                  </span>
                  <span className={styles.orangeValue}>&nbsp;{numberWithCommas(currentCountyData.confirmed_cum)}</span>
                </div>
                 <div className={styles.infoHead}>
                  <span

                  >
                    Change in past 7 days:
                  </span>
                  <span className={styles.redValue}>&nbsp;{("+")+numberWithCommas(currentCountyData.cases_wk_ch)}</span>
                </div>
                <div className={styles.infoHead}>
                  <span
                    className={cx({[styles.underlined]: target === 'cases' && calcType === '100k'})}
                  >
                    per 100k population:
                  </span>
                  <span className={styles.orangeValue}>
                    &nbsp;{numberWithCommas(this.calc100k(currentCountyData, 'confirmed_cum'))}
                  </span>
                </div>
                <div className={styles.spacer}/>
                <div className={styles.infoBlockHeader}>Deaths</div>
                <div className={styles.infoHead}>
                  <span
                    className={cx({[styles.underlined]: target === 'deaths' && calcType === 'count'})}
                  >
                    Counts:
                  </span>
                  <span className={styles.orangeValue}>&nbsp;{numberWithCommas(currentCountyData.deaths_cum)}</span>
                </div>
                <div className={styles.infoHead}>
                  <span>
                    Change in past 7 days:
                  </span>
                  <span className={styles.redValue}>&nbsp;{("+")+numberWithCommas(currentCountyData.deaths_wk_ch)}</span>
                </div>
                <div className={styles.infoHead}>
                  <span
                    className={cx({[styles.underlined]: target === 'deaths' && calcType === '100k'})}
                  >
                    per 100k population:
                  </span>
                  <span className={styles.orangeValue}>
                  &nbsp;{numberWithCommas(this.calc100k(currentCountyData, 'deaths_cum'))}
                  </span>
                </div>

                <div className={styles.spacer}/>
                <div className={styles.infoBlockHeader}>Hospital & Population Info</div>
                <div className={styles.infoHead}>
                  <span>ICU Beds:</span> <span className={styles.orangeValue}>{numberWithCommas(currentCountyData.all_icu)}</span>
                </div>
                <div className={styles.infoHead}>
                  <span>Hospitals:</span> <span
                  className={styles.orangeValue}>{numberWithCommas(currentCountyData.hospitals_in_cost_reports)}</span>
                </div>

                <div className={styles.infoHead}>
                  <span>Nursing Homes:</span> <span
                  className={styles.orangeValue}>{numberWithCommas(currentCountyData.n_nursing)}</span>
                </div>
                <div className={styles.infoHead}>
                  <span>Ave. Nursing Home Rating</span> <span
                  className={styles.orangeValue}>{currentCountyData.overall_nh_r+(" out of 5")}</span>
                </div>
                                {  /*   <div className={styles.spacer}/>
             <div className={styles.infoBlockHeader}>Population characteristics</div> */}
                <div className={styles.infoHead}>
                  <span>Population Density:</span> <span
                  className={styles.orangeValue}>{numberWithCommas(Math.floor(currentCountyData.pop_dens))+(" per sq mi")}</span>
                </div>
                <div className={styles.infoHead}>
                  <span>Population:</span> <span
                  className={styles.orangeValue}>{numberWithCommas(Math.floor(currentCountyData.POPESTIMATE2019))}</span>
                </div>
                <div className={styles.infoHead}>
                  <span>Percent in Poverty:</span> <span
                  className={styles.orangeValue}>{numberWithCommas(Math.floor(currentCountyData.perc_pov))+("%")}</span>
                </div>
                <div className={styles.infoHead}>
                  <span>Percent Aged 60 or older:</span> <span
                  className={styles.orangeValue}>{numberWithCommas(Math.floor(currentCountyData.X60plus_pct))+("%")}</span>
                </div>
                <span className={styles.footnote}>
                  *total number since January 22, 2020
                </span>
              </div>
            )}
            {currentCounty && !currentCountyData && <div style={{ color: '#fff', textAlign: 'center' }}>Sorry, we do not have data for this county</div>}
          </div>
          <div className={styles.contentWrapper}>
            <div className={styles.map} id="map"/>
            {currentCounty && <div className={styles.charts}>
              <div className={styles.chartContainer}>
                <span>{currentCounty}, {currentStateCode} - {(target === 'cases' && 'New Cases') || 'Deaths'} Reported per Day</span>
                <span>Hover over bar for exact number</span>
                {barChartData && (
                  <C3Chart config={{
                    data: barChartData,
                    axis: {
                      x: {
                        label: {
                          text: 'Month-Day in 2020',
                          position: 'outer-center',
                        },
                        type: 'timeseries',
                        tick: {
                          format: '%m-%d'
                        }
                      },
                      y: {
                        label: 'Count',
                        position: 'outer-middle'
                      }
                    },
                    legend: {
                      show: false,
                    }
                  }}
                />
                )}
              </div>
              {/*<div className={styles.chartContainer}>*/}
              {/*  <canvas id="covidChart"/>*/}
              {/*</div>*/}
            </div>
            }
            {/* <ScatterPlot data={covidData} type={target} onClick={this.onPlotClicked} county={currentCountyData} /> */}
          </div>
        </div>
      </div>
    );
  }
}

