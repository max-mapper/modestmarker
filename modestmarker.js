/*
 * modestmarker.js - simple markers and popups for modestmaps
 * https://github.com/maxogden/modestmarker
 * 
 * MIT LICENSE
 *
 * depends on: modestmaps.js, smokesignals.js, zepto.js (see example for details)
 */

function ModestMarker (map, options) {
  var me = this

  // make this an event emitter
  smokesignals.convert(me)
  
  $.extend(me, options || {})
  
  me.map = map
  if (typeof me.latitude === "string") me.latitude = parseFloat(me.latitude)
  if (typeof me.longitude === "string") me.longitude = parseFloat(me.longitude)
  me.location = new MM.Location(me.latitude, me.longitude)
  
  me.container = $('<div class="marker"></div>')
  me.container.css('position', 'absolute')
  me.image = $('<img src="' + (me.markerImage || 'marker-solid-24.png') + '">')
  me.container.append(me.image)
  me.map.parent.appendChild(me.container[0])
  
  me.map.addCallback('panned', function() { me.updatePosition.call(me) })
  me.map.addCallback('zoomed', function() { me.updatePosition.call(me) })
  me.map.addCallback('resized', function() { me.updatePosition.call(me) })
  
  me.touch = ('ontouchstart' in window) ? true : false
  if (me.touch) me.map.parent.ontouchstart = function(e) { me.emit('mapClick', e) }
  else me.map.parent.onmousedown = function(e) { me.emit('mapClick', e) }
  
  me.updatePosition()
}

ModestMarker.prototype.updatePosition = function() {
  var me = this
  var popupShowing = (me.popup && me.popup.css('display') !== "none")
  var point = me.map.locationPoint(me.location)
  me.container.css('left', point.x - me.image.width() / 2 + 'px')
  var top = point.y - me.image.height()
  if (popupShowing) top = top - me.popupHeight
  me.container.css('top', top + 'px')
  if (popupShowing) me.showPopup()
}

// popups are hidden by default so this makes them visible very quickly to get their height
ModestMarker.prototype.getPopupHeight = function() {
  var me = this
  var offsetLeft = me.popup.css('left')
  var display = me.popup.css('display')
  me.popup.css({'left': "-9999px", 'display': "block"})
  var height = me.popup.offsetHeight
  me.popup.css({'left': offsetLeft, 'display': display})
  return height
}


ModestMarker.prototype.setPopup = function(html, options) {
  var me = this
  me.offsetY = options.offsetY || 0
  var popupStyle = "display: none; overflow: auto; position: relative; z-index: 666;"
  me.popup = $('<div class="marker-popup" style="' + popupStyle + '">' + html + '</div>')
  me.container.append(me.popup)
  me.popupHeight = me.getPopupHeight()
  
  function togglePopup(e) {
    if ((me.popup && me.popup.css('display') !== "none")) me.showPopup.call(me)
    else me.hidePopup.call(me)
  }
  
  function dismissPopup(e) { if (e.target !== me.image) me.hidePopup.call(me) }
  
  if (me.touch) me.container.ontouchstart = togglePopup
  me.on('mapClick', dismissPopup)
  
  var mouseHover = (options.hover && !me.touch)
  if (mouseHover) me.container.onmouseover = function() { me.showPopup.call(me) }
  if (mouseHover) me.container.onmouseout = function() { me.hidePopup.call(me) }
  
  var mouseClick = (!options.hover && !me.touch)
  if (mouseClick) me.container.onmousedown = togglePopup
}

ModestMarker.prototype.hidePopup = function(e) {
  var me = this
  me.image.css('cursor', 'default')
  me.popup.hide()
}

ModestMarker.prototype.showPopup = function(e) {
  var me = this
  me.popup.css({
    'display': 'block',
    'left': "-" + me.image.width() / 2 + 'px',
    'top': me.offsetY + 'px'
  })
  me.image.css('cursor', 'pointer')
}
