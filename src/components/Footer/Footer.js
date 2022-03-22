import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import styles from './Footer.module.scss'

export default () => {
  return (
    <footer className={styles.footer}>
      <div className="d-flex justify-content-between align-items-center my-3">
      {/*  <small>
          Source:{' '}
          <a href="https://github.com/CSSEGISandData/COVID-19" target="_blank">
            2019 Novel Coronavirus COVID-19 (2019-nCoV) Data Repository by Johns Hopkins CSSE
          </a>
        </small>*/}
        <div>
          <FontAwesomeIcon icon="copyright" size="sm" />
          &nbsp;<small>2020 <a target="_blank" rel="noopener noreferrer" href="/">Horacio Perassi</a> All Rights Reserved.</small>
        </div>
      </div>
    </footer>
  )
}