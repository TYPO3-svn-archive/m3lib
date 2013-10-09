if (window.OpenLayers && OpenLayers.Layer.OSM) {
	OpenLayers.Layer.OSM.prototype.attribution = 'Kartendaten &copy <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> und Mitwirkende';
	OpenLayers.Layer.OSM.Mapnik.prototype.attribution = OpenLayers.Layer.OSM.prototype.attribution;
}

if (window.GeoExt && GeoExt.ux.GeoNamesSearchCombo) {
	GeoExt.ux.GeoNamesSearchCombo.prototype.lang = 'de';
	GeoExt.ux.GeoNamesSearchCombo.prototype.loadingText = 'Frage www.geonames.org ab ...';
	GeoExt.ux.GeoNamesSearchCombo.prototype.emptyText = 'Ort über www.geonames.org suchen';
}

tx_m3lib.lang.frameTitle = 'Geometrie bearbeiten';
tx_m3lib.lang.ok = 'OK';
tx_m3lib.lang.cancel = 'Abbrechen';
tx_m3lib.lang.navigation = 'Kartenausschnitt verschieben';
tx_m3lib.lang.drawPoint = 'Punkt erfassen';
tx_m3lib.lang.drawPath = 'Pfad erfassen';
tx_m3lib.lang.drawPolygon = 'Fläche erfassen';
tx_m3lib.lang.dragFeature = 'Geometrie verschieben';
tx_m3lib.lang.modifyFeature = 'Stützpunkte bearbeiten';
tx_m3lib.lang.removeFeature = 'Geometrie löschen';

tx_m3lib.lang.controls.LayerSwitcher = 'Kartenverwaltung';
tx_m3lib.lang.controls.OverviewMap = 'Übersichtskarte';
