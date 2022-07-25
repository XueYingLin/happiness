const PAGE_INTRO = 0
const PAGE_OVERVIEW = 1

var currentPage = PAGE_INTRO

const PAGE_SETTINGS = [
  {
    title: 'Introduction',
  },
  {
    title: 'Overview',
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

function renderCurrentPage() {
  updateNavigationButtons()
  $('content').innerHTML = ''
  let pageSettings = PAGE_SETTINGS[currentPage]
  $('title').innerText = pageSettings.title

  renderCard('Hello')
}

function updateNavigationButtons() {
  $('prev').style.visibility = currentPage > 0 ? 'visible' : 'hidden'
  $('next').style.visibility =
    currentPage < PAGE_SETTINGS.length - 1 ? 'visible' : 'hidden'
}

function renderCard(title, renderSvgFn) {
  let template = $('cardTemplate').cloneNode(true)
  template.id = title
  template.style = ''
  let titleElement = template.getElementsByTagName('h2')[0]
  titleElement.innerText = title

  let svgElement = template.getElementsByTagName('svg')[0]
  svgElement.id = title + '_svg'
  if (renderSvgFn) {
    renderSvgFn(svgElement.id)
  }

  $('content').appendChild(template)
}

// Shortcut for getElementById
function $(id) {
  return document.getElementById(id)
}
