import React from 'react';
import { useLocation, useHistory, Link } from 'react-router-dom';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import './Navbar.scss'
import Logo from '../../images/logo.png'

export default () => {
  const location = useLocation();
  const history = useHistory();

  return (
    <Navbar bg="custom" expand="lg">
      <Navbar.Brand href="http://www.visavisllc.com/">
      <img alt="Vis-a-Vis logo" src={Logo} width={30} />
      </Navbar.Brand>
      <Link to="/" className="navbar-text">
        <strong className="ml-2">Coronavirus COVID-19 in U.S. Counties</strong>
      </Link>
      <Navbar.Toggle aria-controls="basic-navbar-nav" />
      <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto" activeKey={location.pathname} onSelect={to => history.push(to)}>
        </Nav>

        <Nav activeKey={location.pathname} onSelect={to => history.push(to)}>
          <Nav.Link href="https://www.cdc.gov/coronavirus/2019-nCoV/index.html">CDC Info</Nav.Link>
          <Nav.Link href="https://www.who.int/emergencies/diseases/novel-coronavirus-2019">WHO Info</Nav.Link>
          <Nav.Link href="https://visavisllc.com">About Us</Nav.Link>
          <Nav.Link eventKey="/data-source">Data Source</Nav.Link>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};
