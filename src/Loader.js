import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';

import App from './App.js'

const Loader = () => {
  const [state, setState] = useState({
    error: false,
    loading: true,
    covidData: [],
    chartData: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const cacheBusterString = moment.utc().startOf('hour').unix();
        const [covidData, chartData] = await Promise.all([
          d3.json(`${process.env.REACT_APP_COVID_DATA_URL}?t=${cacheBusterString}`),
          d3.json(`${process.env.REACT_APP_COVID_DATA_TIME_URL}?t=${cacheBusterString}`)
        ])
  
        setState({
          loading: false,
          covidData,
          chartData
        });
      } catch (e) {
        setState({
          error: true,
          ...state,
        })
      }
    }
    
    fetchData();
  }, [])

  if (state.error) {
    return (
      <div 
        className="d-flex justify-content-center align-items-center"
        style={{
          height: "calc(100% - 60px)"
        }}
      >
        <div className="alert alert-danger">
          <strong>Uh Oh!</strong> Failed to fetch data, please try again later.
        </div>
      </div>
    )
  }

  if (state.loading) {
    return (
      <div 
        className="d-flex justify-content-center align-items-center"
        style={{
          height: "calc(100% - 60px)"
        }}
      >
        <FontAwesomeIcon icon="spinner" size="4x" spin color="#DE4933" />
      </div>
    )
  }

  return <App covidData={state.covidData} chartData={state.chartData} />
}

export default Loader;