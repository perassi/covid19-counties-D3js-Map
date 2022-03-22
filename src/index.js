import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import {
  faCopyright,
  faSearch,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';

import 'antd/dist/antd.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import './utils/ga';

import Loader from './Loader';
import DataSource from './components/DataSource/DataSource';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer'

import * as serviceWorker from './serviceWorker';

const AppRouter = () => {
  library.add(
    faCopyright,
    faSearch,
    faSpinner
  );

  return (
    <Router>
      <Navbar />
      <Switch>
        <Route path="/" exact>
          <Loader />
        </Route>
        <Route path="/data-source" exact>
          <DataSource />
        </Route>
      </Switch>
      <Footer />
    </Router>
  )
}

ReactDOM.render(<AppRouter />, document.getElementById('root'));
// serviceWorker.register();
