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
  me.div = document.createElement('div')
  me.div.className = 'marker'
  me.div.style.position = "absolute"
  me.img = document.createElement('img')
  me.img.src = me.markerImage || 'marker-solid-24.png'
  me.div.appendChild(me.img)
  me.map.addCallback('panned', function() { me.updatePosition.call(me) })
  me.map.addCallback('zoomed', function() { me.updatePosition.call(me) })
  me.map.addCallback('resized', function() { me.updatePosition.call(me) })
  me.map.parent.appendChild(me.div)
  me.updatePosition()
}

ModestMarker.prototype.updatePosition = function() {
  var me = this
  var point = me.map.locationPoint(me.location)  
  me.div.style.left = point.x - me.img.width / 2 + 'px'
  me.div.style.top = point.y - me.img.height + 'px'
  if (me.popup && me.popup.style.display === "block") me.showPopup()
}

ModestMarker.prototype.setPopup = function(html, options) {
  var me = this
  me.offsetY = options.offsetY || 0
  me.popup = document.createElement('div')
  me.popup.className = 'popup'
  me.popup.style.display = "none"
  me.popup.style.position = "absolute"
  me.popup.innerHTML = html
  me.map.parent.appendChild(me.popup)
  
  function togglePopup() {
    if (me.popup.style.display === "none") me.showPopup.call(me)
    else me.hidePopup.call(me)
  }
  
  function dismissPopup(e) { if (e.target !== me.img) me.hidePopup.call(me) }
  
  var touch = ('ontouchstart' in window) ? true : false
  if (touch) me.div.ontouchstart = togglePopup
  if (touch) me.map.parent.ontouchstart = dismissPopup
  
  var mouseHover = (options.hover && !touch)
  if (mouseHover) me.div.onmouseover = function() { me.showPopup.call(me) }
  if (mouseHover) me.div.onmouseout = function() { me.hidePopup.call(me) }
  
  var mouseClick = (!options.hover && !touch)
  if (mouseClick) me.map.parent.onmousedown = dismissPopup
  if (mouseClick) me.div.onmousedown = togglePopup
}

ModestMarker.prototype.hidePopup = function(e) {
  var me = this
  me.img.style.cursor = 'default'
  me.popup.style.display = 'none'
}

ModestMarker.prototype.showPopup = function(e) {
  var me = this
  me.popup.style.display = 'block'
  me.popup.style.left = me.div.offsetLeft - .5 * me.popup.offsetWidth + .5 * me.img.width + 'px'
  me.popup.style.top = me.div.offsetTop - me.popup.offsetHeight - me.offsetY + 'px'
  me.img.style.cursor = 'pointer'
}
