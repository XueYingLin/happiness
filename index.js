const PAGE_INTRO = 0
const PAGE_OVERVIEW = 1

var currentPage = PAGE_INTRO

const PAGE_SETTINGS = [
  {
    title: 'Introduction',
    renderCards: () => {
      renderCard('#content', 'About this Narrative Visualization', renderAbout)
    },
  },
  {
    title: 'Overview',
    renderCards: () => {
      renderCard('#content', 'Happiest Countries', renderTop5)
      renderCard('#content', 'Saddest Countries', renderBottom5)
    },
  },
]

function nextPage() {
  currentPage++
  renderCurrentPage()
}

function prevPage() {
  currentPage--
  renderCurrentPage()
}

async function renderCurrentPage() {
  updateNavigationButtons()
  $('content').innerHTML = ''
  let pageSettings = PAGE_SETTINGS[currentPage]
  $('title').innerText = pageSettings.title
  PAGE_SETTINGS[currentPage].renderCards()
}

function updateNavigationButtons() {
  $('prev').style.visibility = currentPage > 0 ? 'visible' : 'hidden'
  $('prevDescription').innerText =
    currentPage > 0 ? PAGE_SETTINGS[currentPage - 1].title : ''
  $('next').style.visibility =
    currentPage < PAGE_SETTINGS.length - 1 ? 'visible' : 'hidden'
  $('nextDescription').innerText =
    currentPage < PAGE_SETTINGS.length - 1
      ? PAGE_SETTINGS[currentPage + 1].title
      : ''
}

function renderCard(selector, title, renderFn) {
  let div = d3.select(selector).append('div').classed('card', true)
  div.append('h2').text(title)

  renderFn(div)
}

// Shortcut for getElementById
function $(id) {
  return document.getElementById(id)
}

async function loadData() {
  return {
    2015: await d3.csv('data/2015.csv'),
    2016: await d3.csv('data/2016.csv'),
    2017: await d3.csv('data/2017.csv'),
    2018: await d3.csv('data/2018.csv'),
    2019: await d3.csv('data/2019.csv'),
  }
}

function renderTop5(div) {
  let happiest = data['2019'].slice(0, 5)
  renderBarChart(div, happiest)
}

function renderBottom5(div) {
  let unhappiest = data['2019'].slice(
    data['2019'].length - 5,
    data['2019'].length
  )
  renderBarChart(div, unhappiest)
}

function renderBarChart(div, data) {
  const xrange = [0, 650]
  const xdomain = [0, 10]
  const yrange = [0, 140]
  const ydomain = [0, 4]

  const xs = d3.scaleLinear().domain(xdomain).range(xrange)
  const ys = d3.scaleLinear().domain(ydomain).range(yrange)

  let svg = div.append('svg').attr('width', 760).attr('height', 180)

  svg
    .append('g')
    .classed('labels', true)
    .attr('transform', 'translate(180, 0)')
    .selectAll('text')
    .data(data)
    .join('text')
    .attr('y', (d, i) => ys(i) + 20)
    .text((d) => d['Country or region'])

  svg
    .append('g')
    .classed('bars', true)
    .attr('transform', 'translate(185, 0)')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('height', 28)
    .attr('width', (d) => {
      return xs(d['Score'])
    })
    .attr('y', (d, i) => ys(i))

  svg
    .append('g')
    .classed('labels', true)
    .attr('transform', 'translate(180, 0)')
    .selectAll('text')
    .data(data)
    .join('text')
    .attr('x', (d, i) => xs(d['Score']))
    .attr('y', (d, i) => ys(i) + 20)
    .text((d) => d['Score'])
}

function renderAbout(div) {
  div
    .append('p')
    .text(
      'This visualization shows data about the Happiness Index of various countries.'
    )
}

let data = undefined

async function loadPage() {
  data = await loadData()
  console.log('Data is ', data)
  renderCurrentPage()
}
