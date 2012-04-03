// Not used, included for reference
// 
// Originally written by @mlevans for https://github.com/stamen/paperwalking

function checkMapOverflow(map, topLeftPoint, bottomRightPoint) {
  var map_extent = map.getExtent()
  var map_top_left_point = map.locationPoint(map_extent[0])
  var map_bottom_right_point = map.locationPoint(map_extent[1])
  
  // Create 4 Boolean values for overflow tests
  var left_overflow = topLeftPoint.x < map_top_left_point.x
  var top_overflow = topLeftPoint.y < map_top_left_point.y
  var right_overflow = bottomRightPoint.x > map_bottom_right_point.x
  var bottom_overflow = bottomRightPoint.y > map_bottom_right_point.y
  
  if (left_overflow || top_overflow || right_overflow || bottom_overflow) {
    var pan_delta_x = 0
    var pan_delta_y = 0
    
    if (right_overflow && bottom_overflow) {
      pan_delta_x = map_bottom_right_point.x - bottomRightPoint.x
      pan_delta_y = map_bottom_right_point.y - bottomRightPoint.y
    } else if (right_overflow && top_overflow) {
      pan_delta_x = map_bottom_right_point.x - bottomRightPoint.x
      pan_delta_y = map_top_left_point.y - topLeftPoint.y
    } else if (left_overflow && top_overflow) {
      pan_delta_x = map_top_left_point.x - topLeftPoint.x
      pan_delta_y = map_top_left_point.y - topLeftPoint.y
    } else if (left_overflow && bottom_overflow) {
      pan_delta_x = map_top_left_point.x - topLeftPoint.x
      pan_delta_y = map_bottom_right_point.y - bottomRightPoint.y
    } else if (left_overflow) {
      pan_delta_x = map_top_left_point.x - topLeftPoint.x
    } else if (top_overflow) {
      pan_delta_y = map_top_left_point.y - topLeftPoint.y
    } else if (right_overflow) {
      pan_delta_x = map_bottom_right_point.x - bottomRightPoint.x
    } else if (bottom_overflow) {
      pan_delta_y = map_bottom_right_point.y - bottomRightPoint.y
    }
    
    var map_center = map.getCenter()
    console.log('map_center', map_center)
    var map_center_point = map.locationPoint(map_center)
    
    // Calculate new center point
    map_center_point.x = map_center_point.x - pan_delta_x
    map_center_point.y = map_center_point.y - pan_delta_y
    
    var new_map_center_loc = map.pointLocation(map_center_point)
    
    //easey.slow(map, {location: new_map_center_loc})
    //map.setCenter(new_map_center_loc)
    map.panBy(pan_delta_x, pan_delta_y)
  } else {
    return
  }
}

function MarkerNote(map, options) {
  // note.note, note.user_id, note.created, note.marker_number, note.latitude, note.longitude
  
  var self = this
  self.map = map
  
  if (!options) options = {}
  Object.keys(options).forEach(function (key) {
    self[key] && (self[key] = options[key])
  })
  
  self.active_polygon = -1
  self.map.active_marker = self.map.active_marker || false
  self.map.note_displayed = self.map.note_displayed || true
  if (!self.map.markerNumber) self.map.markerNumber = -1
  
  self.addNote()
}

MarkerNote.prototype.reset = function() {
  var self = this
  
  self.map.active_marker = self.map.active_marker || false
  self.map.note_displayed = self.map.note_displayed || true
  if (!self.map.markerNumber) self.map.markerNumber = -1
  self.location = self.map.getCenter()
  
  var data = self.data = {
    'lat': self.location.lat,
    'lon': self.location.lon,
    'marker_number': self.map.markerNumber,
    'user_id': self.current_user_id,
    'note': ''
  }
  
  self.div = document.createElement('div')
  self.div.className = 'marker'
  self.img = document.createElement('img')
  self.img.src = 'img/icon_x_mark_new.png'
  self.div.appendChild(self.img)
  self.new_marker_text_area = document.getElementById('new_marker_textarea')
  
  var input_lat = document.createElement('input')
  input_lat.value = this.location.lat.toFixed(6)
  input_lat.type = 'hidden'
  input_lat.name = 'marker[' + self.map.markerNumber + '][lat]'
  self.div.appendChild(input_lat)
  
  var input_lon = document.createElement('input')
  input_lon.value = this.location.lon.toFixed(6)
  input_lon.type = 'hidden'
  input_lon.name = 'marker[' + self.map.markerNumber + '][lon]'
  self.div.appendChild(input_lon)
  
  var scan_id = document.createElement('input')
  scan_id.value = scan_id
  scan_id.name = 'marker[' + self.map.markerNumber + '][scan_id]'
  scan_id.type = 'hidden'
  self.div.appendChild(scan_id)
  
  var user_id = document.createElement('input')
  user_id.value = self.data.current_user_id
  user_id.name = 'marker[' + self.map.markerNumber + '][scan_id]'
  user_id.type = 'hidden'
  self.div.appendChild(user_id)
  
  self.map.markerNumber--
  
  // make it easy to drag
  self.img.onmousedown = self.imageMouseDown
  self.img.onmouseup = self.imageMouseUp
  
  // add it to the map
  self.map.addCallback('panned', self.updatePosition)
  self.map.addCallback('zoomed', self.updatePosition)
  self.updatePosition()
  
  var ok_button = document.getElementById('new_marker_ok_button')
  ok_button.onclick = function() { self.submitNote.call(self) }
    
  var remove_button = document.getElementById('new_marker_delete_button')
  remove_button.onclick = function() { self.removeMarkerNote.call(self) }
  
  var editable_new_note_textarea = document.getElementById('new_marker_textarea')
  editable_new_note_textarea.onchange = function () { self.data.note = this.value }
}

MarkerNote.prototype.addNote = function() {
  var self = this
  if (self.active_polygon !== -1 || self.map.active_marker) return alert('Please finish editing your active marker.')
  if (self.draw_mode) return alert('Please finish your creating polygon note before adding a new marker note.')
  
  self.reset()
  document.getElementById('marker-container').appendChild(self.div)
  
  var marker_width = 30
  var offsetY = 5
  var note = document.getElementById('new_marker_note')
  note.className = 'show'    
  note.style.position = "absolute"
  note.style.left = self.div.offsetLeft - .5 * note.offsetWidth + .5 * marker_width + 'px'
  note.style.top = self.div.offsetTop - note.offsetHeight - offsetY + 'px'
  
  self.editable_new_note = note
  self.map.active_marker = true
  self.map.note_displayed = true
}

MarkerNote.prototype.updatePosition = function() {
  var self = this
  var point = self.map.locationPoint(self.location)
  
  self.div.style.left = point.x + 'px'
  self.div.style.top = point.y + 'px'
  
  if (self.map.note_displayed) {
    var marker_width = 30
    var offsetY = 5
    
    var note = document.getElementById('new_marker_note')
    note.style.left = self.div.offsetLeft - .5 * note.offsetWidth + .5 * marker_width + 'px'
    note.style.top = self.div.offsetTop - note.offsetHeight - offsetY + 'px'
    self.editable_new_note = note
  }
}

MarkerNote.prototype.imageMouseDown = function(e) {
  var self = this
  if (self.active_polygon !== -1 || (self.map.active_marker && !self.map.note_displayed) || self.draw_mode) return
  
  self.map.active_marker = true
  
  self.map.note_displayed = true
  
  var ok_button = document.getElementById('new_marker_ok_button')
  ok_button.onclick = self.submitNote
  
  var remove_button = document.getElementById('new_marker_delete_button')
  remove_button.onclick = self.removeMarkerNote
  
  var editable_new_note = document.getElementById('new_marker_note')
  editable_new_note.className = 'show'
  
  var editable_new_note_textarea = document.getElementById('new_marker_textarea')
  
  editable_new_note_textarea.onchange = self.editableNewNoteOnchange
  
  var marker_width = 30
  var offsetY = 5
  
  editable_new_note.style.position = "absolute"
  editable_new_note.style.left = div.offsetLeft - .5*editable_new_note.offsetWidth + .5*marker_width + 'px'
  editable_new_note.style.top = div.offsetTop - editable_new_note.offsetHeight - offsetY + 'px'
  
  var marker_start = {x: div.offsetLeft, y: div.offsetTop},
    mouse_start = {x: e.clientX, y: e.clientY}
  
  var note_start = {x: editable_new_note.offsetLeft, y: editable_new_note.offsetTop}
  
  document.onmousemove = self.mouseMoveDuringEdit
  
  return false
}

MarkerNote.prototype.imageMouseUp = function(e) {
  var self = this
  var marker_end = {x: self.div.offsetLeft, y: self.div.offsetTop}
  self.location = self.map.pointLocation(marker_end)
  
  self.data.lat = self.location.lat.toFixed(6)
  self.data.lon = self.location.lon.toFixed(6)

  document.onmousemove = null
  return false
}

MarkerNote.prototype.mouseMoveDuringEdit = function(e) {
  var mouse_now = {x: e.clientX, y: e.clientY}

  div.style.left = (marker_start.x + mouse_now.x - mouse_start.x) + 'px'
  div.style.top = (marker_start.y + mouse_now.y - mouse_start.y) + 'px'
  
  editable_new_note.style.left = (note_start.x + mouse_now.x - mouse_start.x) + 'px'
  editable_new_note.style.top = (note_start.y + mouse_now.y - mouse_start.y) + 'px'
}

MarkerNote.prototype.submitNote = function() {
  var self = this
  if (self.new_marker_text_area.value.trim() == '') {
    alert('Please fill out your note!')
    return false
  } else {
    console.log(self.data)
    console.log(self)
    
    // reqwest({
    //   url: self.options.post_url,
    //   method: 'post',
    //   data: data,
    //   type: 'json',
    //   error: function(err) {
    //     console.log(err)
    //   },
    //   success: function (resp) {
    //     console.log('resp', resp)
    //     self.changeMarkerDisplay(resp)
    //   }
    // })
    
    self.map.active_marker = false
    self.map.note_displayed = false
  
    return false
  }
}

MarkerNote.prototype.changeMarkerDisplay = function(resp) {
  var self = this
  self.div.parentNode.removeChild(self.div)
  
  self.new_marker_note = document.getElementById('new_marker_note')
  self.new_marker_note.className = 'hide'

  var note = resp.note_data
  
  self.addSavedNote(note)
}

MarkerNote.prototype.removeMarkerNote = function() {
  var self = this
  self.div.parentNode.removeChild(self.div)
  
  self.editable_new_note = document.getElementById('new_marker_note')
  self.editable_new_note.className = 'hide'
  
  self.map.active_marker = false
  self.map.note_displayed = false
}

// example usage:
// var saved_marker = new SavedMarker(map, options)
// document.getElementById('marker-container').appendChild(saved_marker)
// options: note, user, created, note_num, lat, lon
function SavedMarker (map, options) {
  var self = this
  if (!options) options = {}
  
  self.options = options
  self.unsignedMarkerNumber = options.unsignedMarkerNumber || -1
  self.note_displayed = false
  self.location = new MM.Location(lat, lon)
  self.data = {
    'marker_number': options.note_num,
    'user_id': options.current_user_id,
    'created': options.created,
    'note': options.note
  }
  if (options.lat) self.data.lat = parseFloat(options.lat)
  if (options.lat) self.data.lon = parseFloat(options.lon)
  
  self.div = document.createElement('div')
  self.div.className = 'marker'
  
  self.img = document.createElement('img')
  self.img.src = 'img/icon_x_mark.png'
  self.div.appendChild(self.img)
  
  // Add a flag that the note was removed
  var removed = document.createElement('input')
  removed.value = 0 // Not removed
  removed.type = 'hidden'
  removed.name = 'marker[' + self.unsignedMarkerNumber + '][removed]'
  div.appendChild(removed)
  
  var input_lat = document.createElement('input')
  input_lat.value = this.location.lat.toFixed(6)
  input_lat.type = 'hidden'
  input_lat.name = 'marker[' + self.unsignedMarkerNumber + '][lat]'
  div.appendChild(input_lat)
  
  var input_lon = document.createElement('input')
  input_lon.value = this.location.lon.toFixed(6)
  input_lon.type = 'hidden'
  input_lon.name = 'marker[' + self.unsignedMarkerNumber + '][lon]'
  div.appendChild(input_lon)
  
  var note_number = document.createElement('input')
  note_number.value = note_num
  note_number.name = 'marker[' + self.unsignedMarkerNumber + '][note_number]'
  note_number.type = 'hidden'
  div.appendChild(note_number)
  
  var scan_id = document.createElement('input')
  scan_id.value = scan_id
  scan_id.name = 'marker[' + self.unsignedMarkerNumber + '][scan_id]'
  scan_id.type = 'hidden'
  div.appendChild(scan_id)
  
  var user_id = document.createElement('input')
  user_id.value = self.data.current_user_id
  user_id.name = 'marker[' + self.unsignedMarkerNumber + '][scan_id]'
  user_id.type = 'hidden'
  div.appendChild(user_id)
  
  self.unsignedMarkerNumber++
  self.saved_note = document.getElementById('marker_tip')
  
  self.img.onmouseover = self.imageMouseOver
  self.img.onmouseout = self.imageMouseOut
  self.img.onmousedown = self.imageMouseDown
  self.img.onmouseup = self.imageMouseUp
  
  map.addCallback('panned', self.updatePosition)
  map.addCallback('zoomed', self.updatePosition)
  map.addCallback('resized', self.updatePosition)
  
  self.initializePosition()
  
  return div
}

SavedMarker.prototype.initializePosition = function() {
  var self = this
  self.location = new MM.Location(self.options.lat, self.options.lon)
  var point = self.map.locationPoint(self.location)
  self.div.style.left = point.x + 'px'
  self.div.style.top = point.y + 'px'
}

SavedMarker.prototype.updatePosition = function() {
  var self = this
  var point = map.locationPoint(self.location)
  
  div.style.left = point.x + 'px'
  div.style.top = point.y + 'px'
  
  if (self.note_displayed) {
    var marker_width = 30
    var offsetY = 5
    var note = document.getElementById('marker_note')
    note.style.left = self.div.offsetLeft - .5 * note.offsetWidth + .5 * marker_width + 'px'
    note.style.top = self.div.offsetTop - note.offsetHeight - offsetY + 'px'
    checkMapOverflow(
      {x: note.offsetLeft, y: note.offsetTop},
      {x: note.offsetLeft + note.offsetWidth, y: note.offsetTop + note.offsetHeight}
    )
  }
}

SavedMarker.prototype.imageMouseUp = function(e) {
  var self = this
  var marker_end = {x: self.div.offsetLeft, y: self.div.offsetTop}
  self.location = self.map.pointLocation(marker_end)
  self.data.lat = self.location.lat.toFixed(6)
  self.data.lon = self.location.lon.toFixed(6)
  self.updatePosition()
  document.onmousemove = null
  return false
}

SavedMarker.prototype.imageMouseDown = function(e) {
  var self = this
  if (self.active_polygon !== -1 || (self.active_marker && !self.note_displayed) || self.draw_mode) return
  self.active_marker = true
  self.note_displayed = true
  
  var ok_button = document.getElementById('marker_ok_button')
  ok_button.onclick = self.submitNote
  
  var cancel_button = document.getElementById('marker_cancel_button')
  cancel_button.onclick = self.resetNote
  
  var remove_button = document.getElementById('marker_delete_button')
  remove_button.onclick = self.removeMarkerNote
  
  self.saved_note.className = 'hide'
  
  self.editable_saved_note = document.getElementById('marker_note')
  self.editable_saved_note.className = 'show'
  
  self.editable_saved_note_textarea = document.getElementById('marker_textarea')
  self.editable_saved_note_textarea.innerHTML = self.data.note

  self.editable_saved_note_textarea.onchange = function () {
    self.data.note = this.value
    console.log('text change')
  }
  
  var marker_width = 30
  var offsetY = 5
  var note = self.editable_saved_note
  
  note.style.position = "absolute"
  note.style.left = self.div.offsetLeft - .5 * note.offsetWidth + .5 * marker_width + 'px'
  note.style.top = self.div.offsetTop - note.offsetHeight - offsetY + 'px'
  
  self.marker_start = {x: div.offsetLeft, y: div.offsetTop}
  self.mouse_start = {x: e.clientX, y: e.clientY}
  self.note_start = {x: note.offsetLeft, y: note.offsetTop}
  self.editable_saved_note = note
  
  document.onmousemove = function(e) {
    var mouse_now = {x: e.clientX, y: e.clientY}
  
    self.div.style.left = (self.marker_start.x + mouse_now.x - self.mouse_start.x) + 'px'
    self.div.style.top = (self.marker_start.y + mouse_now.y - self.mouse_start.y) + 'px'
    
    self.editable_saved_note.style.left = (self.note_start.x + mouse_now.x - self.mouse_start.x) + 'px'
    self.editable_saved_note.style.top = (self.note_start.y + mouse_now.y - self.mouse_start.y) + 'px'
  }
  
  return false
}

SavedMarker.prototype.imageMouseOut = function(e) {
  var self = this
  self.img.src = 'img/icon_x_mark.png'
  self.img.style.cursor = 'move'
  
  if (self.saved_note.className = 'show') {
    self.saved_note.className = 'hide'
  }
}

SavedMarker.prototype.imageMouseOver = function(e) {
  var self = this
  if (self.active_polygon == -1 && !self.active_marker && !self.draw_mode) {
    self.img.src = 'img/icon_x_mark_hover.png'
    
    if (self.data.created) {
      var date = new Date(self.data.created * 1000)
      var day = date.getDate()
      var month = date.getMonth()
      var year = date.getFullYear()
      
      var formatted_date = (parseInt(month) + 1) + '/' + day + '/' + year
  
      self.saved_note.innerHTML = self.data.note + '<br><br>' + formatted_date
    } else {
      self.saved_note.innerHTML = self.data.note
    }
          
    var marker_width = 30
    var offsetY = 5
    
    self.saved_note.className = 'show'
    self.saved_note.style.position = "absolute"
    self.saved_note.style.left = self.div.offsetLeft - .5 * self.saved_note.offsetWidth + .5 * marker_width + 'px'
    self.saved_note.style.top = self.div.offsetTop - self.saved_note.offsetHeight - offsetY + 'px'
  } else {
    self.img.style.cursor = 'default'
  }
}

SavedMarker.prototype.hidePolygonNote = function() {
  var self = this
  if (self.active_polygon != -1) {
    self.savePolygon(self.active_polygon)
    self.active_polygon = -1
  }
}

SavedMarker.prototype.changeMarkerDisplay = function(resp) {
  var self = this
  self.editable_saved_note = document.getElementById('marker_note')
  self.editable_saved_note.className = 'hide'
  self.editable_saved_note_textarea = document.getElementById('marker_textarea')
  self.editable_saved_note_textarea.innerHTML = resp.note_data.note
}

SavedMarker.prototype.submitNote = function() {
  var self = this
  console.log('data', self.data)
  console.log('post_url', self.post_url)
  reqwest({
    url: self.post_url,
    method: 'post',
    data: self.data,
    type: 'json',
    error: function (err) {
      console.log('error', err)
    },
    success: function (resp) {
      //console.log('response',resp)
      if (resp.status != 200) {
      alert('There was a problem: ' + resp.message)
      }
      
      self.changeMarkerDisplay(resp)
    }
  })
  self.active_marker = false
  self.note_displayed = false
  return false
}

SavedMarker.prototype.resetNote = function() {
  var self = this
  self.location = new MM.Location(self.options.lat, self.options.lon)
  var orig_point = self.map.locationPoint(self.location)

  self.div.style.left = orig_point.x + 'px'
  self.div.style.top = orig_point.y + 'px'
  
  self.editable_saved_note_textarea = document.getElementById('marker_textarea')
  self.editable_saved_note_textarea.innerHTML = self.editable_new_note
  
  /*
  if (textarea.className == 'show' && remove_button.className == 'show' && ok_button.className == 'show' && cancel_button.className == 'show') {
    textarea.className = 'hide'
    ok_button.className = 'hide'
    cancel_button.className = 'hide'
    remove_button.className = 'hide'
  }
  */
  
  self.editable_saved_note = document.getElementById('marker_note')
  self.editable_saved_note.className = 'hide'
  
  self.active_marker = false
  self.note_displayed = false
  
  return false
}

SavedMarker.prototype.removeMarkerNote = function() {
  var self = this
  if (window.confirm("Are you sure you want to delete this saved note?")) {
    self.div.parentNode.removeChild(self.div)
    
    self.editable_saved_note = document.getElementById('marker_note')
    self.editable_saved_note.className = 'hide'
    
    self.data.removed = 1 // Removed
    
    self.submitNote()
    
    self.active_marker = false
    self.note_displayed = false
  } else {
    return false
  }
}
