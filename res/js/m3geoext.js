// determine current character set and use it for geocoding
GeoExt.ux.GeoNamesSearchCombo.prototype.charset =
	document.charset ? document.charset : (
			document.characterSet ? document.characterSet : (
					document.inputEncoding ? document.inputEncoding : 'UTF8'
				)
		);