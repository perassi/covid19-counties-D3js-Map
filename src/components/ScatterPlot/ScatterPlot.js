import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import _ from 'lodash'

import styles from './ScatterPlot.module.scss'

const buttons = [{
  value: 'pop_dens',
  label: 'Population Density'
}, {
  value: 'perc_pov',
  label: 'Percent Poverty'
}]

export default ({ data, type, onClick, county }) => {
  const ref = useRef(null);
  const [option, setOption] = useState('pop_dens')

  const margin = {
    left: 50,
    right: 25,
    top: 25,
    bottom: 75
  }

  useEffect(() => {
    const { width, height } = ref.current.getBoundingClientRect();

    const svg = d3.select(ref.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)

    const axis = svg.append('g').attr('class', 'axes')

    axis.append('g').attr('class', 'x-axis')
    axis.append('g').attr('class', 'y-axis')

    const grid = axis.append('g').attr('class', 'grid')

    grid.append('g').attr('class', 'grid-x')
    grid.append('g').attr('class', 'grid-y')

    svg.append('g').attr('class', 'nodes')

    const btn = svg
      .append('foreignObject')
      .attr('width', width)
      .attr('height', 30)
      .attr('transform', `translate(${0}, ${height - 40})`)
      .append('xhtml:div')
      .attr('class', 'btn-group btn-group-center')
      .selectAll('button')
      .data(buttons)

    btn
      .enter()
      .append('button')
      .attr('class', 'btn btn-primary')
      .classed('btn-selected', d => d.value === option)
      .html(d => d.label)
      .on('click', d => {
        setOption(d.value)

        btn.classed('btn-selected', d => d.value === option)
      })
      
  }, [])

  useEffect(() => {
    const xArray = data.map(d => d[option] || 0)
    const confirmedArr = data.map(d => d.confirmed_cum || 0)
    const deathArr = data.map(d => d.deaths_cum || 0)
    
    const { width, height } = ref.current.getBoundingClientRect();
    const svg = d3.select(ref.current).select('svg')

    const btns = svg.select('.btn-group').selectAll('button').data(buttons)

    btns.classed('btn-selected', d => d.value === option)

    const xScale = d3.scaleLinear().range([margin.left, width - margin.right]).domain([_.min(xArray), _.max(xArray)]);
    const yScale = d3.scaleLinear()
      .range([margin.top, height - margin.bottom])
      .domain(type === 'cases' ? [_.max(confirmedArr), _.min(confirmedArr)] : [_.max(deathArr), _.min(deathArr)]);

    svg
      .select('.x-axis')
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .transition()
      .call(d3.axisBottom(xScale))

    svg
      .select('.y-axis')
      .attr("transform", `translate(${margin.left}, 0)`)
      .transition()
      .call(d3.axisLeft(yScale))

    svg
      .select('.grid')
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call(g => g
        .select('.grid-x')
        .selectAll('line')
        .data(xScale.ticks())
        .join("line")
        .attr("x1", d => 0.5 + xScale(d))
        .attr("x2", d => 0.5 + xScale(d))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
      )
      .call(g => g
        .select('.grid-y')
        .selectAll('line')
        .data(yScale.ticks())
        .join("line")
        .attr("y1", d => 0.5 + yScale(d))
        .attr("y2", d => 0.5 + yScale(d))
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
      )

    // Force
    // const simulation = d3.forceSimulation(data)
    // .force("x", d3.forceX(d => xScale(d[option] || 0)).strength(1))
    // .force("y", d3.forceY(d => yScale(d.confirmed_cum)))
    // .force("collide", d3.forceCollide().radius(3))
    // .force("manyBody", d3.forceManyBody().strength(-10))
    // .stop()

    // Calculate position (with force) synchronously 100 ticks
    // simulation.tick(100)
    let nodeData = _.map(data, d => ({
      ...d,
      x: xScale(d[option] || 0),
      y: yScale(d[type === 'cases' ? 'confirmed_cum' : 'deaths_cum'])
    }))

    const nodeWrapper = svg.select('.nodes')
    const nodes = nodeWrapper.selectAll('.node').data(nodeData, d => `${d.stateID}-${d.countyID}`);

    const node = nodes
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      
    node
      .append('circle')
      .attr("cx", 0)
      .attr("cy", 0)
      .attr('opacity', 0.25)
      .attr('fill', type === 'cases' ? '#065794' : '#252525')
      .attr("r", 3)
      .on('click', d => onClick(d))

    node
      .append('text')
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr('dx', 5)
      .attr('dy', '0.3em')
      .attr('opacity', 0.5)
      .html(d => d.Areaname || '')
      .on('click', d => onClick(d))

    nodes
      .transition()
      .attr('opacity', d => {
        if (!county) {
          return 1
        }

        return county.Areaname === d.Areaname ? 1 : 0.1;
      })
      .attr('transform', d => `translate(${d.x}, ${d.y})`)

    nodes
      .select('circle')
      .attr('fill', type === 'cases' ? '#065794' : '#252525')
  }, [type, data, margin, option, county])

  return (
    <div className={styles.plot} ref={ref}></div>
  )
}