const PAGE_INTRO = 0
const PAGE_OVERVIEW = 1

var currentPage = PAGE_INTRO

const xrange = [0, 650]
const xdomain = [0, 10]
const yrange = [0, 140]
const ydomain = [0, 4]

const xs = d3.scaleLinear().domain(xdomain).range(xrange)
const ys = d3.scaleLinear().domain(ydomain).range(yrange)

const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]

let currentTimer = undefined

const PAGE_SETTINGS = [
  // {
  //   title: 'World Happiness',
  //   tiles: {
  //     topChart: {
  //       render: renderAbout,
  //     },
  //   },
  // },
  {
    title: 'Most and Least Happy',
    description: `
    <p>
      This slideshow shows data from the <a href="https://worldhappiness.report/">World Happiness Report</a>
      for various countries. The World Happiness Report collects an <i>Average Life Evaluation</i> value ("score") for each
      country. The collection methodology for this data for 2022 can be found <a href="https://worldhappiness.report/ed/2022/happiness-benevolence-and-trust-during-covid-19-and-beyond/#measuring-and-explaining-national-differences-in-life-evaluations">here</a>.
      The score for each country is a three year average.
    </p>
    <p>
      This scene shows the 5 most happy and least happy countries for the most recent survey year (2022), demonstrating
      the significant variance between life evaluation scores for the highest and lowest ranking countries.
    </p>
    <p>
      Countries marked with an asterisk (*) have missing survey data for some years. In these years, the World Happiness
      Report uses forward the score from the last surveyed year.  
    </p>
    `,
    tiles: {
      topChart: {
        title: 'Most Happy Countries (2022)',
        render: renderTop5,
      },
      bottomChart: {
        title: 'Least Happy Countries (2022)',
        render: renderBottom5,
      },
    },
  },
  {
    title: 'Change Over Time',
    description: `
    <p>
      The 10 countries with the highest average life evaluation have changed over the last 7 years. This scene provides
      an animated visualization showing how the top ranked countries have changed position between 2015 and 2022.
    </p>
    `,
    tiles: {
      topChart: {
        title: 'Top 10 Over Time',
        render: renderOverTime,
      },
    },
  },
  {
    title: 'Population, GDP, and Happiness',
    description: `
    <p>
      Population and wealth are contributing factors to happiness. In this scene, we use
      <a href="https://data.worldbank.org/">Data from the World Bank</a> to allow interactive exploration of how
      population size and gross domestic product (GDP) in US Dollars per capita affect happiness. Countries are
      represented by colored circles, the size of which represents the gross domestic product (GDP) in
      current US Dollars per capita. The x-axis is the average life evaluation ("score"), and the y-axis is
      population size on a logarithmic scale. 
    </p>
    <p>
      You can interact with this scene by clicking on a circle to see details about a specific country, by changing
      whether to annotate the 5 most or least happy countries, by changing the year, or by adjusting the percentile
      of GDP per capita shown using the GDP slider.
    </p>
    <p>
      Note: World Bank data does not yet cover population and GDP data for 2022, so it's not included here.
    </p>
    `,
    tiles: {
      topChart: {
        render: renderScatterPlot,
      },
      topControls: {
        render: renderScatterControls,
      },
      topDetail: {
        render: renderScatterDetail,
      },
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
  if (currentTimer) {
    clearInterval(currentTimer)
  }
  updateNavigationButtons()
  $('content').innerHTML = ''
  let pageSettings = PAGE_SETTINGS[currentPage]
  $('title').innerText = pageSettings.title

  let keys = [
    'topChart',
    'topControls',
    'topDetail',
    'bottomChart',
    'bottomControls',
    'bottomDetail',
  ]

  for (var key of keys) {
    let tileData = pageSettings.tiles[key]
    if (tileData) {
      renderCard(tileData.title, tileData.render, key)
    }
  }

  if (pageSettings.description) {
    d3.select('#content')
      .append('div')
      .attr('id', 'pageDescription')
      .html(pageSettings.description)
  }
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

function renderCard(title, renderFn, gridClass) {
  let card = createCard(title, renderFn, gridClass)
  d3.select('#content').call(card)
}

function createCard(title, renderFn, gridClass) {
  return (selection) => {
    let div = selection.append('div').attr('class', 'card ' + gridClass)
    if (title) {
      div.append('h2').text(title)
    }
    renderFn(div)
  }
}

// Shortcut for getElementById
function $(id) {
  return document.getElementById(id)
}

async function loadData() {
  return {
    happiness: {
      2015: await d3.csv('data/2015.csv'),
      2016: await d3.csv('data/2016.csv'),
      2017: await d3.csv('data/2017.csv'),
      2018: await d3.csv('data/2018.csv'),
      2019: await d3.csv('data/2019.csv'),
      2020: await d3.csv('data/2020.csv'),
      2021: await d3.csv('data/2021.csv'),
      2022: await d3.csv('data/2022.csv'),
    },
    population: await loadWorldBankData('data/population.csv'),
    gdp: await loadWorldBankData('data/gdp.csv'),
  }
}

async function loadWorldBankData(url) {
  let rawData = await d3.csv(url)

  let byYear = {}
  for (var data of rawData) {
    const country = renameWorldBankCountry(data['Country Name'])
    for (var year of YEARS) {
      if (byYear[year] === undefined) {
        byYear[year] = {}
      }
      byYear[year][country] = data[year]
    }
  }
  return byYear
}

function renderTop5(div) {
  let happiest = data.happiness['2022'].slice(0, 5)
  renderBarChart(div, happiest)
}

function renderBottom5(div) {
  let unhappiest = data.happiness['2022'].slice(
    data.happiness['2022'].length - 5,
    data.happiness['2022'].length
  )
  renderBarChart(div, unhappiest)
}

function renderBarChart(div, data, width = 760, height = 180) {
  let svg = div.append('svg').attr('width', width).attr('height', height)

  svg
    .append('g')
    .classed('labels', true)
    .attr('transform', 'translate(180, 0)')
    .selectAll('text')
    .data(data)
    .join('text')
    .attr('id', (d) => createId('countryLabel', d['Country']))
    .attr('y', (d, i) => ys(i) + 20)
    .text((d) => d['Country'])

  svg
    .append('g')
    .classed('bars', true)
    .attr('transform', 'translate(185, 0)')
    .selectAll('rect')
    .data(data)
    .join('rect')
    .attr('style', (d) => 'fill:' + countryColor(d['Country']))
    .attr('id', (d) => createId('bar', d['Country']))
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
    .attr('id', (d) => createId('scoreLabel', d['Country']))
    .attr('x', (d, i) => xs(d['Score']))
    .attr('y', (d, i) => ys(i) + 20)
    .text((d) => d['Score'])
}

function countryColor(country) {
  return colors[countryHash(country)]
}

function countryHash(country) {
  return (Math.abs(hashCode(country)) % colors.length) + 1
}

function hashCode(string) {
  var hash = 0
  for (var i = 0; i < string.length; i++) {
    var code = string.charCodeAt(i)
    hash = (hash << 5) - hash + code
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

let data = undefined

async function loadPage() {
  data = await loadData()
  console.log(data)
  renderCurrentPage()
}

function renderOverTime(div) {
  let happiest = data.happiness['2015'].slice(0, 50)

  // Render the 2015 chart
  renderBarChart(div, happiest, 760, 345)
  d3.select('h2').text('Top 10 Over Time: 2015')

  const years = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022']
  let currentYear = 0

  currentTimer = setInterval(() => {
    if (currentYear == years.length - 1) {
      currentYear = 0
    } else {
      currentYear++
    }

    const happiest = data.happiness[years[currentYear]].slice(0, 100)

    d3.select('h2').text('Top 10 Over Time: ' + years[currentYear])

    var svg = d3.select('body').transition()

    for (var i = 0; i < happiest.length; i++) {
      const d = happiest[i]
      svg
        .select('#' + createId('bar', happiest[i]['Country']))
        .duration(750)
        .attr('width', xs(d['Score']))
        .attr('y', ys(i))

      svg
        .select('#' + createId('countryLabel', happiest[i]['Country']))
        .duration(750)
        .attr('y', ys(i) + 20)

      svg
        .select('#' + createId('scoreLabel', happiest[i]['Country']))
        .duration(750)
        .attr('x', xs(d['Score']))
        .attr('y', ys(i) + 20)
        .text(parseFloat(d['Score']).toFixed(3))
    }
  }, 2000)
}

function createId(prefix, countryName) {
  return prefix + '-' + countryName.replace(/^[^a-z]+|[^\w:.-]+/gi, '')
}

function getCombinedData(year) {
  let scatterData = []
  for (d of data.happiness[year].slice().reverse()) {
    const country = d['Country']
    const happiness = d['Score']
    const population = data.population[year][country]
    const gdp = data.gdp[year][country]

    if (population !== undefined && gdp !== undefined) {
      scatterData.push({ country, happiness, population, gdp, visible: true })
    }
  }
  return scatterData
}

var scatter = {
  xs: d3.scaleLinear().domain([2.4, 8.2]).range([0, 720]),
  ys: d3.scaleLog().domain([100000, 1750000000]).range([340, 0]),
  rs: d3.scaleLinear().domain([0, 64000]).range([0, 15]),
  year: 2020,
  annotation: 'Most Happy',
  gdpPercentile: 0,
}

function renderScatterCircles() {
  d3.select('#scatterCircles')
    .selectAll('circle')
    .data(scatter.data)
    .join('circle')
    .on('click', (e, d) => {
      setScatterSelection(d)
    })
    .attr('visibility', (d) => (d.visible ? 'visible' : 'hidden'))
    .attr('cx', (d, i) => scatter.xs(d.happiness))
    .attr('cy', (d, i) => scatter.ys(d.population))
    .attr('r', (d, i) => 3 + scatter.rs(d.gdp))
    .attr('style', (d, i) => 'fill:' + countryColor(d.country))
}

function renderScatterPlot(div) {
  // Merge a table of country, 2020 population, 2020 happiness, 2020 gdp per capita
  scatter.data = getCombinedData(scatter.year)

  const gdps = []
  for (var d of scatter.data) {
    const gdp = parseInt(d.gdp, 10)
    if (!isNaN(gdp)) {
      gdps.push(gdp)
    }
  }
  gdps.sort((a, b) => a - b)

  scatter.gdpQuantiles = []
  for (var i = 0.0; i <= 1.0; i += 0.1) {
    scatter.gdpQuantiles.push(d3.quantile(gdps, i))
  }

  const yAxis = d3.axisLeft(scatter.ys)
  const xAxis = d3.axisBottom(scatter.xs)

  const svg = div.append('svg').attr('width', 850).attr('height', 385)

  var happiness = []
  for (d of data.happiness[scatter.year]) {
    happiness.push(parseFloat(d['Score']))
  }
  happiness.sort()

  var p25 = d3.quantile(happiness, 0.25)
  var p50 = d3.quantile(happiness, 0.5)
  var p75 = d3.quantile(happiness, 0.75)
  let lines = [p25, p50, p75]
  let labels = ['25%ile', 'Median', '75%ile']

  console.log('Percentiles: ', [p25, p50, p75])

  const percentileGroup = svg.append('g').attr('transform', 'translate(50, 0)')

  percentileGroup
    .selectAll('line')
    .data(lines)
    .join('line')
    .attr('x1', (d) => scatter.xs(d))
    .attr('x2', (d) => scatter.xs(d))
    .attr('y1', 20)
    .attr('y2', 340)
    .attr('stroke', '#444444')

  percentileGroup
    .selectAll('text')
    .data(lines)
    .join('text')
    .text((d, i) => labels[i])
    .attr('x', (d) => scatter.xs(d))
    .attr('y', 20)
    .attr('class', 'smalltext')

  svg
    .append('g')
    .attr('id', 'scatterCircles')
    .attr('transform', 'translate(50, 0)')
  renderScatterCircles()

  svg.append('g').attr('transform', 'translate(50,340)').call(xAxis)
  svg.append('g').attr('transform', 'translate(50,0)').call(yAxis)

  svg
    .append('text')
    .attr('class', 'axisLabel')
    .text('Population')
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .attr('y', 15)
    .attr('x', -180)

  svg
    .append('text')
    .attr('class', 'axisLabel')
    .text('Average Life Evaluation')
    .attr('text-anchor', 'middle')
    .attr('y', 380)
    .attr('x', 50 + 700 / 2)

  svg
    .append('g')
    .attr('id', 'scatterAnnotations')
    .attr('class', 'annotation-group')
    .attr('transform', 'translate(50, 0)')

  renderScatterAnnotations()
}

function renderScatterAnnotations() {
  var annotationY = 340 / 2 - 30 * 5 + 50
  var annotationX = 700

  var sliceStart = 0
  var sliceEnd = 0
  if (scatter.annotation === 'Least Happy') {
    sliceStart = scatter.data.length - 5
    sliceEnd = scatter.data.length
  } else if (scatter.annotation === 'Most Happy') {
    sliceStart = 0
    sliceEnd = 5
  }

  const annotated = scatter.data
    .slice()
    .reverse()
    .slice(sliceStart, sliceEnd)
    .sort((a, b) => b.population - a.population)

  const annotations = annotated.map((d) => {
    let dy = annotationY - scatter.ys(d.population)
    let dx = annotationX - scatter.xs(d.happiness)

    annotationY += 58

    return {
      type: d3.annotationCalloutCircle,
      note: {
        title: d.country,
        label: parseFloat(d.happiness).toFixed(3),
        wrap: 190,
      },
      subject: {
        radius: 3 + scatter.rs(d.gdp),
      },
      x: scatter.xs(d.happiness),
      y: scatter.ys(d.population),
      color: countryColor(d.country),
      dx,
      dy,
    }
  })

  const makeAnnotations = d3
    .annotation()
    .type(d3.annotationlabel)
    .annotations(annotations)

  d3.select('#scatterAnnotations').call(makeAnnotations)
}

function renderScatterDetail(div) {
  div.append('div').attr('id', 'scatterDetail')
  setScatterSelection(undefined)
}

function renderScatterControls(div) {
  let detail = div.append('div').attr('id', 'scatterControls')

  detail.append('span').text('Year:')
  detail
    .append('select')
    .on('change', (e) => {
      scatter.year = e.target.value
      d3.select('.topChart').html('')
      renderScatterPlot(d3.select('.topChart'))
      updateGDPQuantiles()
    })
    .selectAll('input')
    .data(YEARS.slice(0, 7))
    .join('option')
    .attr('value', (d) => d)
    .attr('selected', (d) => (d === scatter.year ? true : null))
    .text((d) => d)

  detail.append('span').text('Annotate:')

  let options = ['Most Happy', 'Least Happy', 'None']

  detail
    .append('select')
    .on('change', (e) => {
      scatter.annotation = e.target.value
      renderScatterAnnotations()
    })
    .selectAll('input')
    .data(options)
    .join('option')
    .attr('value', (d) => d)
    .text((d) => d)

  detail.append('span').text('GDP:')
  detail
    .append('input')
    .attr('type', 'range')
    .attr('min', 0)
    .attr('max', 100)
    .attr('value', 0)
    .attr('step', 10)
    .on('input', (e) => {
      scatter.gdpQuantile = parseInt(e.target.value, 10)
      updateGDPQuantiles()
    })
  detail.append('span')

  detail.append('span').attr('id', 'gdpPercentile').attr('class', 'smalltext')
  scatter.gdpQuantile = 0
  updateGDPQuantiles()
}

function updateGDPQuantiles() {
  const quantile_gdp = scatter.gdpQuantiles[scatter.gdpQuantile / 10]
  for (var data of scatter.data) {
    var gdp = parseFloat(data.gdp)
    data.visible = gdp > quantile_gdp
  }

  const format = d3.format('.3s')
  d3.select('#gdpPercentile').text(
    `${scatter.gdpQuantile}th Percentile - $${format(
      scatter.gdpQuantiles[scatter.gdpQuantile / 10]
    )} / cap`
  )
  renderScatterCircles()
}

const colors = [
  'LightSalmon',
  'DarkSalmon',
  'Salmon',
  'Lightcoral',
  'Indianred',
  'Red',
  'Crimson',
  'FireBrick',
  'DarkRed',
  'Pink',
  'LightPink',
  'HotPink',
  'DeepPink',
  'PaleVioletRed',
  'MediumVioletRed',
  'Gold',
  'Orange',
  'DarkOrange',
  'LightSalmon',
  'Coral',
  'Tomato',
  'OrangeRed',
  'PapayaWhip',
  'Moccasin',
  'PeachPuff',
  'DarkKhaki',
  'LightCyan',
  'Brown',
  'Aquamarine',
  'DimGray',
  'Turquoise',
  'DarkTurquoise',
  'CadetBlue',
  'SteelBlue',
  'LightSteelBlue',
  'LimeGreen',
  'MediumSeaGreen',
  'SeaGreen',
  'ForestGreen',
  'Green',
  'DarkGreen',
  'YellowGreen',
  'OliveDrab',
  'Violet',
  'Orchid',
  'MidnightBlue',
  'MediumOrchid',
  'MediumPurple',
  'RebeccaPurple',
  'BlueViolet',
  'DarkViolet',
  'DarkOrchid',
]

// Countries that don't have matching names across the happiness index and
// World Bank data sets. We rename these to the happiness index version.
const RENAME_COUNTRIES = {
  'Hong Kong SAR, China': 'Hong Kong S.A.R. of China',
  'Russian Federation': 'Russia',
  'Slovak Republic': 'Slovakia',
  'Korea, Rep.': 'South Korea',
  'Kyrgyz Republic': 'Kyrgyzstan',
  "Cote d'Ivoire": 'Ivory Coast',
  'Congo, Rep.': 'Congo (Brazzaville)',
  'North Macedonia': 'Macedonia',
  Turkiye: 'Turkey',
  'Venezuela, RB': 'Venezuela',
  'Lao PDR': 'Laos',
  'Gambia, The': 'Gambia',
  'Iran, Islamic Rep.': 'Iran',
  'Egypt, Arab Rep.': 'Egypt',
  'Yemen, Rep.': 'Yemen',
}

// Rename a country from its world bank name to its happiness index name
function renameWorldBankCountry(country) {
  let renamed = RENAME_COUNTRIES[country]
  if (renamed === undefined) {
    return country
  }
  return renamed
}

function setScatterSelection(data) {
  scatter.selection = data

  let div = d3.select('#scatterDetail')
  div.html('')

  if (data) {
    div
      .call(createSquare('12', countryColor(data.country)))
      .append('span')
      .text(' ' + data.country)

    div
      .call(createImage('12', 'dollar', 'GDP Per Capita (Current US$)'))
      .append('span')
      .text(
        ' ' +
          parseFloat(data.gdp).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      )
    happy = parseFloat(data.happiness, 10) >= 5.0
    div
      .call(
        createImage(
          '12',
          happy ? 'smile' : 'sad',
          happy ? 'Happiness Index >= 5' : 'Happiness Index < 5'
        )
      )
      .append('span')
      .text(' ' + parseFloat(data.happiness).toFixed(3))
    div
      .call(createImage('12', 'people', 'Population'))
      .append('span')
      .text(' ' + parseInt(data.population, 10).toLocaleString())
  } else {
    div.text('Click on a country to see details')
  }
}

function createSquare(size, color) {
  return (container) =>
    container
      .append('svg')
      .attr('width', size)
      .attr('height', size)
      .append('rect')
      .attr('width', size)
      .attr('height', size)
      .attr('style', 'fill:' + color)
}

function createImage(size, name, alt) {
  return (container) =>
    container
      .append('img')
      .attr('width', size)
      .attr('height', size)
      .attr('src', 'image/' + name + '.svg')
      .attr('alt', alt)
      .attr('title', alt)
}
