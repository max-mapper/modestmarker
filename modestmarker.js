function ModestMarker (map, options) {
  var me = this
  if (!options) options = {}
  
  Object.keys(options).forEach(function (key) {
    me[key] = options[key]
  })
  
  me.map = map
  if (typeof me.latitude === "string") me.latitude = parseFloat(me.latitude)
  if (typeof me.longitude === "string") me.longitude = parseFloat(me.longitude)
  me.location = new MM.Location(me.latitude, me.longitude)
  me.container = document.createElement('div')
  me.container.className = 'marker'
  me.container.style.position = "absolute"
  me.image = document.createElement('img')
  me.image.src = me.markerImage || 'marker-solid-24.png'
  me.container.appendChild(me.image)
  me.map.addCallback('panned', function() { me.updatePosition.call(me) })
  me.map.addCallback('zoomed', function() { me.updatePosition.call(me) })
  me.map.addCallback('resized', function() { me.updatePosition.call(me) })
  me.map.parent.appendChild(me.container)
  me.updatePosition()
}

ModestMarker.prototype.updatePosition = function() {
  var me = this
  var point = me.map.locationPoint(me.location)  
  me.container.style.left = point.x - me.image.width / 2 + 'px'
  me.container.style.top = point.y - me.image.height + 'px'
  if (me.popup && me.popup.style.display === "block") me.showPopup()
}

// popups are hidden by default so this makes them visible very quickly to get their height
ModestMarker.prototype.getPopupSize = function() {
  var me = this
  var offsetLeft = me.popup.style.left
  var display = me.popup.style.display
  me.popup.style.left = "-9999px"
  me.popup.style.display = "block"
  var width = me.popup.offsetWidth
  var height = me.popup.offsetHeight
  me.popup.style.left = offsetLeft
  me.popup.style.display = display
  return {width: width, height: height}
}


ModestMarker.prototype.setPopup = function(html, options) {
  var me = this
  me.offsetY = options.offsetY || 0
  me.popup = document.createElement('div')
  me.popup.className = 'popup'
  me.popup.style.display = "none"
  me.popup.style.position = "relative"
  me.popup.style.overflow = "auto"
  me.popup.style['z-index'] = "666"
  me.popup.innerHTML = html
  me.container.appendChild(me.popup)
  me.popupSize = me.getPopupSize()
  
  function togglePopup() {
    if (me.popup.style.display === "none") me.showPopup.call(me)
    else me.hidePopup.call(me)
  }
  
  function dismissPopup(e) { if (e.target !== me.image) me.hidePopup.call(me) }
  
  var touch = ('ontouchstart' in window) ? true : false
  if (touch) me.container.ontouchstart = togglePopup
  if (touch) me.map.parent.ontouchstart = dismissPopup
  
  var mouseHover = (options.hover && !touch)
  if (mouseHover) me.container.onmouseover = function() { me.showPopup.call(me) }
  if (mouseHover) me.container.onmouseout = function() { me.hidePopup.call(me) }
  
  var mouseClick = (!options.hover && !touch)
  if (mouseClick) me.map.parent.onmousedown = dismissPopup
  if (mouseClick) me.container.onmousedown = togglePopup
}

ModestMarker.prototype.hidePopup = function(e) {
  var me = this
  me.image.style.cursor = 'default'
  me.popup.style.display = 'none'
}

ModestMarker.prototype.showPopup = function(e) {
  var me = this
  me.popup.style.display = 'block'
  me.popup.style.left = (-me.popupSize.width / 2) + (me.image.width / 2) + 'px'
  me.popup.style.top = me.offsetY - me.popupSize.height - me.image.height + 'px'
  me.image.style.cursor = 'pointer'
}
