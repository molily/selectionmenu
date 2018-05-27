/*
SelectionMenu 1.1
http://github.com/molily/selectionmenu
by molily (molily@mailbox.org, http://molily.de/)

EN: SelectionMenu displays a context menu when the user selects some text on the page
DE: SelectionMenu blendet ein Kontextmenü beim Markieren von Text ein

EN: License: Public Domain
EN: You're allowed to copy, distribute and change the code without restrictions

DE: Lizenz: Public Domain
DE: Kopieren, Verteilen und Aendern ohne Einschraenkungen erlaubt
*/

// EN: Create a private scope using an anonymous function,
// EN: save the return value in a global variable.
// DE: Erzeuge einen privaten Scope durch eine anonyme Funktion,
// DE: speichere den Rückgabwert in einer globalen Variable
var SelectionMenu = (function (window, document) {

	// EN: The menu element which is inserted when selecting text
	// DE: Das Menü-Element, welche beim Markieren eingefügt wird
	var span = null;

	// EN: Shared private helper functions
	// DE: Geteilte private Helferfunktionen

	function addEvent (obj, type, fn) {
		// EN: Feature dection DOM Events / Microsoft
		// DE: Fähigkeitenweiche DOM Events / Microsoft
		if (obj.addEventListener) {
			obj.addEventListener(type, fn, false);
		} else if (obj.attachEvent) {
			obj.attachEvent('on' + type, function () {
				return fn.call(obj, window.event);
			});
		}
	}

	// EN: Publish addEvent as a static method
	// EN: (attach it to the constructor object)
	// DE: Mache addEvent als statische Methode öffentlich
	// DE: (hefte die Methode an den Konstruktor, der zurückgegeben wird)
	SelectionMenu.addEvent = addEvent;

	function getSelection () {
		// EN: Feature dection HTML5 / Microsoft
		// DE: Fähigkeitenweiche HTML5 / Microsoft
		if (window.getSelection) {
			return window.getSelection();
		} else if (document.selection && document.selection.createRange) {
			return document.selection.createRange();
		} else {
			// EN: No browser support available for the required features
			// DE: Keine Browser-Unterstützung für die benötigten Features
			return false;
		}
	}

	function getSelectedText (selection) {
		// EN: Feature detection HTML5 / Microsoft
		// DE: Fähigkeitenweiche HTML5 / Microsoft
		return selection.toString ? selection.toString() : selection.text;
	}


	function contains (a, b) {
		// EN: Feature detection DOM Core / Microsoft
		// DE: Fähigkeitenweiche DOM Core / Microsoft
		return a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : a.contains(b);
	}

	function mouseOnMenu (e) {
		// Greife auf das Zielelement des Ereignisses zu
		// EN: Feature detection DOM Events / Microsoft
		// DE: Fähigkeitenweiche DOM Events / Microsoft
		var target = e.target || e.srcElement;
		// Ist das Zielelement das Menü oder darin enthalten?
		return target == span || contains(span, target);
	}

	// EN: Main constructor function
	// DE: Konstruktorfunktion
	function SelectionMenu (options) {
		var instance = this;

		// EN: Copy members from the options object to the instance
		// DE: Kopiere Einstellungen aus dem options-Objekt herüber zur Instanz
		instance.id = options.id || 'selection-menu';
		instance.menuHTML = options.menuHTML;
		instance.minimalSelection = options.minimalSelection || 5;
		instance.container = options.container;
		instance.handler = options.handler;

		// EN: Initialisation
		// DE: Initialisiere
		instance.create();
		instance.setupEvents();
	}

	SelectionMenu.prototype = {

		create : function () {
			var instance = this;

			// EN: Create the menu container if necessary
			// DE: Erzeuge den Menü-Container, sofern noch nicht passiert
			if (span) {
				return;
			}

			span = document.createElement('span');
			span.id = instance.id;
		},

		setupEvents : function () {

			var instance = this;
			var container = instance.container;

			// EN: Hide the menu on mouse down
			// DE: Verstecke beim Mousedown
			addEvent(container, 'mousedown', function (e) {
				instance.hide(e);
			});

			// EN: Insert the menu on mouseup given some text is selected
			// DE: Füge das Menü beim Mouseup ein, wenn Text ausgewählt wurde
			addEvent(container, 'mouseup', function (e) {
				instance.insert(e);

				// EN: After a delay, check if the text was deselected
				// DE: Prüfe nach einer Verzögerung, ob die Auswahl damit aufgehoben wurde
				window.setTimeout(function () {
					instance.hideIfNoSelection();
				}, 0);

			});

			instance.setupMenuEvents();
		},

		setupMenuEvents : function () {
			var instance = this;

			// EN: Register the handler for clicks on the menu
			// DE: Registiere Handlerfunktion für den Klick auf das Menü
			addEvent(span, 'click', function (e) {
				instance.handler.call(instance, e);
				return false;
			});

			// EN: Prevent IE to select the text of the menu
			// DE: Verhindere das Markieren des Menüs im IE
			span.unselectable = true;
		},

		hide : function (e) {
			// EN: Abort if an event object was passed and the click hit the menu itself
			// Breche ab, wenn Event-Objekt übergeben wurde und der Klick beim Menü passierte
			if (e && mouseOnMenu(e)) {
				return;
			}
			// EN: Is the element attached to the DOM tree?
			// DE: Ist das Element in den DOM-Baum gehängt?
			var parent = span.parentNode;
			if (parent) {
				// EN: Remove the element from DOM (the element object remains
				// EN: in memory and will be reused later)
				// DE: Entferne das element aus dem DOM-Baum (Element bleibt im Speicher erhalten
				// DE: und wird später wiederverwendet)
				parent.removeChild(span);
			}
		},

		hideIfNoSelection : function () {
			var instance = this;
			var selection = getSelection();
			if (!selection) {
				return;
			}
			var selectedText = getSelectedText(selection);
			if (!selectedText.length) {
				instance.hide();
			}
		},

		insert : function (e) {
			var instance = this;

			// EN: Abort if the mouse event occured at the menu itself
			// DE: Breche ab, wenn das Mausereignis beim Menü passierte
			if (mouseOnMenu(e)) {
				return;
			}

			// EN: Get a Selection object or a TextRange (IE)
			// DE: Hole Selection bzw. TextRange (IE)
			var selection = getSelection();
			if (!selection) {
				// EN: No browser support available for the required features
				// DE: Keine Browser-Unterstützung für die benötigten Features
				return;
			}

			// EN: Get the selected text
			// DE: Hole markierten Text
			var selectedText = getSelectedText(selection);
			instance.selectedText = selectedText;

			// EN: Abort if the selected text is too short
			// DE: Breche ab, wenn der markierte Text zu kurz ist
			if (selectedText.length < instance.minimalSelection) {
				instance.hide(e);
				return;
			}

			// EN : Feature detection DOM Range / Microsoft
			// DE: Fähigkeitenweiche DOM Range / Microsoft
			if (selection.getRangeAt) {

				// EN: W3C DOM Range approach
				// DE: Lösungsansatz mit W3C DOM Range

				// EN: Get the first Range of the current Selection
				// DE: Hole Range, die zur Selection gehört
				var range = selection.getRangeAt(0);

				// EN: Get the start and end nodes of the selection
				// DE: Hole Start- und Endknoten der Auswahl
				var startNode = range.startContainer;
				var endNode = range.endContainer;

				if (!(startNode && endNode && startNode.compareDocumentPosition)) {
					// EN: Abort if we got bogus values or we can't compare their document position
					// DE: Breche ab, wenn die Knoten nicht brauchbar sind
					return;
				}

				// EN: If the start node succeeds the end node in the DOM tree, flip them
				// DE: Wenn von hinten nach vorne markiert wurde, drehe Start und Ende um
				if (startNode.compareDocumentPosition(endNode) & 2) {
					startNode = endNode;
					endNode = range.startContainer;
				}

				// EN: Get the end offset
				// DE: Hole End-Offset
				var endOffset = range.endOffset;

				// EN: If the end node is an element, use its last text node as the end offset
				// DE: Falls der Endknoten ein Element ist, nehme das Ende des letzten Textknoten
				if (endNode.nodeType == 1) {
					endNode = endNode.lastChild;
					if (!endNode || endNode.nodeType != 3) {
						return;
					}
					endOffset = endNode.data.length;
				}

				// EN: Create a new empty Range
				// DE: Erzeuge neue, leere Range
				var newRange = document.createRange();

				// EN: Move the beginning of the new Range to the end of the selection
				// DE: Verschiebe Anfang der neuen Range an das Ende der Auswahl
				newRange.setStart(endNode, endOffset);

				// EN: Fill the menu span
				// DE: Befülle das Menü-span
				span.innerHTML = instance.menuHTML;

				// EN: Inject the span element into the new Range
				// DE: Füge das span-Element in die neue Range ein
				newRange.insertNode(span);

				// EN: Adjust the selection by removing and adding the range.
				// EN: This prevents the selection of the menu text.
				// DE: Korrigiere Auswahl, verhindere das Markieren des Menüs
				if (selection.removeRange) {
					selection.removeRange(range);
				} else {
					selection.removeAllRanges();
				}
				selection.addRange(range);

			} else if (selection.duplicate) {

				// EN: Microsoft TextRange approach
				// DE: Lösungsansatz mit Microsoft TextRanges

				// EN: Create a copy the the TextRange
				// DE: Kopiere TextRange
				var newRange = selection.duplicate();

				// EN: Move the start of the new range to the end of the selection
				// DE: Verschiebe den Anfang der neuen Range an das Ende der Auswahl
				newRange.setEndPoint('StartToEnd', selection);

				// EN: Fill the menu span
				// DE: Befülle das Menü-span
				span.innerHTML = instance.menuHTML;

				// EN: Insert the span into the new range
				// DE: Fülle die neue Range mit dem span
				newRange.pasteHTML(span.outerHTML);

				// EN: Restore the selection so that the original text is selected
				// EN: and not the menu
				// DE: Korrigiere Auswahl und setze sie auf die ursprüngliche Auswahl zurück,
				// DE: sodass das Menü nicht selektiert ist
				selection.select();

				// EN: Since we're using outerHTML to insert the span element,
				// EN: we have to restore the span reference and the event handling
				// DE: Da das Befüllen nicht über das DOM, sondern über serialisierten HTML-Code erfolgt,
				// DE: stelle die Referenz und das Event-Handling wieder her
				span = document.getElementById(id);
				instance.setupMenuEvents();

			} else {
				// EN: No browser support available for the required features
				// DE: Keine Browser-Unterstützung für die benötigten Features
				return;
			}

			// EN: Menu positioning
			// DE: Positioniere Menü
			instance.position();
		},

		position : function () {
			span.style.marginTop = -(span.offsetHeight + 5) + 'px';
		}
	};

	// EN: Return the constructor function
	// DE: Gib den Konstruktor zurück
	return SelectionMenu;

})(window, document);