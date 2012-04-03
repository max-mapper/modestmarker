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
}

ModestMarker.prototype.setPopup = function(html, offsetY) {
  var me = this
  me.offsetY = offsetY || 0
  me.popup = document.createElement('div')
  me.popup.className = 'popup'
  me.popup.style.display = "none"
  me.popup.style.position = "absolute"
  me.popup.innerHTML = html
  me.map.parent.appendChild(me.popup)
  me.div.onmouseover = function() { me.showPopup.call(me) }
  me.div.onmouseout = function() { me.hidePopup.call(me) }
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
