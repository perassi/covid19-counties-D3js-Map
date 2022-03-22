import React from 'react'

import styles from './DataSource.module.scss'

export default () => {
  return (
    <div className={styles.dataSource}>
      <h1>Data Sources</h1>

      <div>
        <span className={styles.label}>Confirmed Cases: </span>
        <span className={styles.value}>
          <a href="https://github.com/CSSEGISandData/COVID-19">2019 Novel Coronavirus COVID-19 (2019-nCoV) Data Repository by Johns Hopkins CSSE</a>
        </span>
      </div>
      <div>
        <span className={styles.label}>Deaths: </span>
        <span className={styles.value}>
          <a href="https://github.com/CSSEGISandData/COVID-19">2019 Novel Coronavirus COVID-19 (2019-nCoV) Data Repository by Johns Hopkins CSSE</a>
        </span>
      </div>
      <div>
        <span className={styles.label}>ICU Beds: </span>
        <span className={styles.value}>Kaiser Health News*</span>
      </div>
      <div>
        <span className={styles.label}>Hospitals: </span>
        <span className={styles.value}>Kaiser Health News*</span>
      </div>
      <div>
        <span className={styles.label}>Nursing Homes: </span>
        <span className={styles.value}>Medicare.gov</span>
      </div>
      <div>
        <span className={styles.label}>Population Density: </span>
        <span className={styles.value}>U.S. Census, 2011 Land Area Estimates</span>
      </div>
      <div>
        <span className={styles.label}>Population: </span>
        <span className={styles.value}>U.S. Census, 2019 Estimated Population</span>
      </div>
      <div>
        <span className={styles.label}>Percent in Poverty: </span>
        <span className={styles.value}>U.S. Census</span>
      </div>

      <div>
      <small>
        <span className={styles.labelmargin}>
          <i>Kaiser Health News (KHN) has not participated in, or has sponsored, approved, or endorsed the manner or purpose of our use or reproduction of the data.</i>
        </span>
      </small>  
      </div>
    </div>
  )
}