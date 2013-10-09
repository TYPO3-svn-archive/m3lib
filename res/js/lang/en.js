if (window.OpenLayers && OpenLayers.Layer.OSM) {
	OpenLayers.Layer.OSM.prototype.attribution = 'Map data &copy <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> and contributors';
	OpenLayers.Layer.OSM.Mapnik.prototype.attribution = OpenLayers.Layer.OSM.prototype.attribution;
}

if (window.GeoExt && GeoExt.ux.GeoNamesSearchCombo) {
	GeoExt.ux.GeoNamesSearchCombo.prototype.lang = 'en';
	GeoExt.ux.GeoNamesSearchCombo.prototype.loadingText = 'Query www.geonames.org ...';
	GeoExt.ux.GeoNamesSearchCombo.prototype.emptyText = 'Search city in www.geonames.org';
}

tx_m3lib.lang.frameTitle = 'Edit geometry';
tx_m3lib.lang.ok = 'OK';
tx_m3lib.lang.cancel = 'Cancel';
tx_m3lib.lang.navigation = 'Pan map view';
tx_m3lib.lang.drawPoint = 'Draw point';
tx_m3lib.lang.drawPath = 'Draw path';
tx_m3lib.lang.drawPolygon = 'Draw polygon';
tx_m3lib.lang.dragFeature = 'Move geometry';
tx_m3lib.lang.modifyFeature = 'Modify geometry points';
tx_m3lib.lang.removeFeature = 'Remove geometry';

tx_m3lib.lang.controls.LayerSwitcher = 'Manage layers';
tx_m3lib.lang.controls.OverviewMap = 'Overview map';
