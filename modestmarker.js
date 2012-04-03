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
