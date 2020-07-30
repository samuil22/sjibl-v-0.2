/*
folding-content.js
v2.1
by Samuel Palpant - http://samuel.palpant.com
MIT License
*/

/**
 * Namespace for the plugin.
 *
 * @since    2.1
 */
var FC = FC || {};

/**
 * Menu setup and maintenance.
 *
 * @since    2.1
 */
FC.menu = {

  menuSelector: '',

  menuItemSelector: '',

  contentSelector: '',

  unfoldedContentBefore: '',

  unfoldedContentAfter: '',

  closeButtonMarkup: '',

  // do initial menu setup
  init: function(
    menuSelector,
    menuItemSelector,
    contentSelector,
    unfoldedContentBefore,
    unfoldedContentAfter,
    closeButtonMarkup
  ) {
    FC.menu.menuSelector = menuSelector;
    FC.menu.menuItemSelector = menuItemSelector;
    FC.menu.contentSelector = contentSelector;
    FC.menu.unfoldedContentBefore = unfoldedContentBefore;
    FC.menu.unfoldedContentAfter = unfoldedContentAfter;
    FC.menu.closeButtonMarkup = closeButtonMarkup;

    FC.menu.setupMenu();
    FC.menu.labelRows();

    FC.events.addParentClickEvent();
    FC.events.addCloseClickEvent();

    FC.resize.init();
  },

  // set up folding parent menu items and cache their content
  setupMenu: function() {
    const $menuItems = jQuery( FC.menu.menuItemSelector, FC.menu.menuSelector );
    const $menu = jQuery( FC.menu.menuSelector );
    for ( let i = 0; i < $menuItems.length; i++ ) {
      const $item = $menuItems.eq(i);
      const $content = $item.children( FC.menu.contentSelector );
      $item
        // add cache key to data attribute
        .data( 'data-fc-key', 'fcid-' + i )
        // void href of immediate child links
        .children( 'a' ).attr( 'href', 'javascript:' );
      if ( ! $item.hasClass( 'folding-parent' ) ) {
        $item.addClass( 'folding-parent' );
      }
      // store this item's content in jquery cache, then remove it
      $menu.data( 'fcid-' + i, $content );
      $content.remove();
    }
  },

  // label begin and end of rows
  labelRows: function() {
    jQuery( '.row-end' ).removeClass( 'row-end' );
    jQuery( '.row-begin' ).removeClass( 'row-begin' );

    const $menuItems = jQuery( FC.menu.menuItemSelector, FC.menu.menuSelector );
    let rowY = -1;
    let $prev = '';
    $menuItems.each( function(){
      const $this = jQuery( this );
      const thisY = $this.position().top;

      if ( thisY != rowY ) {
        $this.addClass( 'row-begin' );
        $prev = $this.prev();
        if ( $prev.hasClass( 'unfolded-content' ) ) {
          // the previous element is the unfolded content, so skip it and go next previous
          $prev = $prev.prev();
        }
        $prev.addClass( 'row-end' );

        rowY = thisY;
      }
    });
    $menuItems.last().addClass( 'row-end' );
  },

  // close any active folding content
  cleanUpActiveFoldingMenu: function() {
    jQuery( '.active-item' )
      .css( 'height', '' )
      .removeClass( 'active-item' );
    jQuery( '.unfolded-content' )
      .slideUp( 400, function() {
        jQuery( this ).remove();
      });
  },

  // find first and last item in $activeItem's row
  // returns an object with .begin and .end
  activeItemRow: function( $activeItem ) {
    let $rowBegin = '';
    let $currentItem = $activeItem;
    for ( let i = 0; i < 100; i++ ) {
      if ( $currentItem.hasClass( 'row-begin' ) ) {
        $rowBegin = $currentItem;
        i += 200;
      } else {
        $currentItem = $currentItem.prev();
      }
    }

    let $rowEnd = '';
    $currentItem = $activeItem;
    for ( let j = 0; j < 100; j++ ) {
      if ( $currentItem.hasClass( 'row-end' ) ) {
        $rowEnd = $currentItem;
        j += 200;
      } else {
        $currentItem = $currentItem.next();
      }
    }

    return { begin: $rowBegin, end: $rowEnd };
  },

  // equalize height of active item with height of tallest item in row
  equalizeItemHeight: function( $activeItem ) {
    const $rowBegin = FC.menu.activeItemRow( $activeItem ).begin;

    let isActiveRow = 0;
    let $currentItem = $rowBegin;
    let $activeRowItems = jQuery();
    // get object of all items in active row
    while ( 100 > isActiveRow ) {
      isActiveRow++;
      $activeRowItems = $activeRowItems.add( $currentItem );
      if ( $currentItem.hasClass( 'row-end' ) ) {
        isActiveRow += 200;
      } else {
        $currentItem = $currentItem.next();
      }
    }

    let maxHeight = 0;
    // find the height of the tallest item in the row
    $activeRowItems.each( function(){
      const $this = jQuery( this );
      if ( maxHeight < $this.outerHeight() ) {
        maxHeight = $this.outerHeight();
      }
    });

    // set active item equal to tallest item
    if ( $activeItem.outerHeight() < maxHeight ) {
      // reset the height on .active-item
      $activeItem.css('height', '');
      // outerHeight() can only find the height
      // we care about outer height, but need to set the inner height with height()
      const heightDifference = $activeItem.outerHeight() - $activeItem.height();
      const newHeight = maxHeight - heightDifference;
      // set the height
      $activeItem.height( newHeight );
    }
  },
} // FC.menu

/**
 * Events setup.
 *
 * @since    2.1
 */
FC.events = {
  // open or close folding menu when parent clicked
  addParentClickEvent: function() {
    jQuery( FC.menu.menuSelector ).on( 'click tap touch', '.folding-parent', function() {
      const $this = jQuery( this );

      if ( $this.hasClass( 'active-item' ) ) {
        // this menu is already open so close it and be done
        FC.menu.cleanUpActiveFoldingMenu();
        return;
      }

      FC.menu.cleanUpActiveFoldingMenu();

      $this.addClass( 'active-item' );

      FC.menu.equalizeItemHeight( $this );

      // assemble content
      let wrapper = '<div class="close-unfolded-content">' + FC.menu.closeButtonMarkup + '</div>';
      wrapper = FC.menu.unfoldedContentBefore + wrapper + FC.menu.unfoldedContentAfter;
      // insert wrapper
      const $activeRowEnd = FC.menu.activeItemRow( $this ).end;
      jQuery( wrapper ).insertAfter( $activeRowEnd );
      const $foldingContent = $activeRowEnd.next();
      $foldingContent.addClass( 'unfolded-content' );

      // get content for this item from cache and append to wrapper
      const contentKey = $this.data( 'data-fc-key' );
      const $content = jQuery( FC.menu.menuSelector ).data( contentKey );
      $content.appendTo( $foldingContent );

      // display content
      $foldingContent.slideDown( 400 );
    });
  },

  // close folding menu when X clicked
  addCloseClickEvent: function() {
    jQuery( FC.menu.menuSelector ).on( 'click tap touch', '.close-unfolded-content', function() {
      FC.menu.cleanUpActiveFoldingMenu();
    });
  },
} // FC.events

/**
 * Handle container resizing.
 *
 * @since    2.1
 */
FC.resize = {
  // set up resize detection and callback
  init: function() {
    const $menu = jQuery( FC.menu.menuSelector );
    FC.resize.addResizeCanary( $menu );

    const $canary = jQuery( '.fc-resize-canary' )[0];
    addResizeListener( $canary, FC.resize.menuResize );
  },

  // we don't want to detect height resize, so add a canary to only detect container width resize
  addResizeCanary: function( $menu ) {
    // requires a height > 15px or else it doesn't detect the window getting smaller ¯\_(ツ)_/¯
    const canaryMarkup = '<div class="fc-resize-canary" style="height: 20px; margin-bottom: -20px;"></div>';
    jQuery( FC.menu.menuSelector).parent().prepend( canaryMarkup );
  },

  // reposition menu on window resize
  menuResize: throttle( function() {
    // remove currently active content
    const $content = jQuery( '.unfolded-content' ).detach();
    // now the floats can flow naturally, so redo the labels
    FC.menu.labelRows();

    // if we removed content before, add it back in
    const $activeItem = jQuery( '.active-item' );
    if ( $activeItem.length ) {
      $activeItem.css( 'height', '' );
      FC.menu.equalizeItemHeight( $activeItem );
      const $activeRowEnd = FC.menu.activeItemRow( $activeItem ).end;
      $content.insertAfter( $activeRowEnd );
    }
  }, 300 ),
} // FC.size

/**
 * Setup and run the jquery plugin.
 *
 * @since    1.0.0
 */
jQuery.fn.foldingContent = function( Args ) {
  jQuery( document ).ready( function() {
    const _args = Args;
    const menuSelector          = _args.menuSelector;
    const menuItemSelector      = _args.menuItemSelector;
    const contentSelector       = _args.contentSelector;
    const unfoldedContentBefore = _args.unfoldBeforeMarkup;
    const unfoldedContentAfter  = _args.unfoldAfterMarkup;
    let closeButtonMarkup       = '';
    if ( _args.closeMarkup ) {
      closeButtonMarkup         = _args.closeMarkup;
    }

    FC.menu.init(
      menuSelector,
      menuItemSelector,
      contentSelector,
      unfoldedContentBefore,
      unfoldedContentAfter,
      closeButtonMarkup
    );
  }); // document ready
}; // jQuery.fn

// Throttle from https://remysharp.com/2010/07/21/throttling-function-calls
function throttle(fn, threshhold, scope) {
  var last,
      deferTimer;
  return function () {
    var context = scope || this;

    var now = +new Date(),
        args = arguments;
    if (last && now < last + threshhold) {
      // hold on to it
      clearTimeout(deferTimer);
      deferTimer = setTimeout(function () {
        last = now;
        fn.apply(context, args);
      }, threshhold);
    } else {
      last = now;
      fn.apply(context, args);
    }
  };
}

/**
* Detect Element Resize
*
* https://github.com/sdecima/javascript-detect-element-resize
* Sebastian Decima
*
* version: 0.5.3
**/

(function () {
	var attachEvent = document.attachEvent,
		stylesCreated = false;

	if (!attachEvent) {
		var requestFrame = (function(){
			var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
								function(fn){ return window.setTimeout(fn, 20); };
			return function(fn){ return raf(fn); };
		})();

		var cancelFrame = (function(){
			var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame ||
								   window.clearTimeout;
		  return function(id){ return cancel(id); };
		})();

		var resetTriggers = function (element){
			var triggers = element.__resizeTriggers__,
				expand = triggers.firstElementChild,
				contract = triggers.lastElementChild,
				expandChild = expand.firstElementChild;
			contract.scrollLeft = contract.scrollWidth;
			contract.scrollTop = contract.scrollHeight;
			expandChild.style.width = expand.offsetWidth + 1 + 'px';
			expandChild.style.height = expand.offsetHeight + 1 + 'px';
			expand.scrollLeft = expand.scrollWidth;
			expand.scrollTop = expand.scrollHeight;
		};

		var checkTriggers = function (element){
			return element.offsetWidth != element.__resizeLast__.width ||
						 element.offsetHeight != element.__resizeLast__.height;
		};

		var scrollListener = function (e){
			var element = this;
			resetTriggers(this);
			if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
			this.__resizeRAF__ = requestFrame(function(){
				if (checkTriggers(element)) {
					element.__resizeLast__.width = element.offsetWidth;
					element.__resizeLast__.height = element.offsetHeight;
					element.__resizeListeners__.forEach(function(fn){
						fn.call(element, e);
					});
				}
			});
		};

		/* Detect CSS Animations support to detect element display/re-attach */
		var animation = false,
			animationstring = 'animation',
			keyframeprefix = '',
			animationstartevent = 'animationstart',
			domPrefixes = 'Webkit Moz O ms'.split(' '),
			startEvents = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' '),
			pfx  = '';
		{
			var elm = document.createElement('fakeelement');
			if( elm.style.animationName !== undefined ) { animation = true; }

			if( animation === false ) {
				for( var i = 0; i < domPrefixes.length; i++ ) {
					if( elm.style[ domPrefixes[i] + 'AnimationName' ] !== undefined ) {
						pfx = domPrefixes[ i ];
						animationstring = pfx + 'Animation';
						keyframeprefix = '-' + pfx.toLowerCase() + '-';
						animationstartevent = startEvents[ i ];
						animation = true;
						break;
					}
				}
			}
		}

		var animationName = 'resizeanim';
		var animationKeyframes = '@' + keyframeprefix + 'keyframes ' + animationName + ' { from { opacity: 0; } to { opacity: 0; } } ';
		var animationStyle = keyframeprefix + 'animation: 1ms ' + animationName + '; ';
	}

	function createStyles() {
		if (!stylesCreated) {
			//opacity:0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
			var css = (animationKeyframes ? animationKeyframes : '') +
					'.resize-triggers { ' + (animationStyle ? animationStyle : '') + 'visibility: hidden; opacity: 0; } ' +
					'.resize-triggers, .resize-triggers > div, .contract-trigger:before { content: \" \"; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; } .resize-triggers > div { background: #eee; overflow: auto; } .contract-trigger:before { width: 200%; height: 200%; }',
				head = document.head || document.getElementsByTagName('head')[0],
				style = document.createElement('style');

			style.type = 'text/css';
			if (style.styleSheet) {
				style.styleSheet.cssText = css;
			} else {
				style.appendChild(document.createTextNode(css));
			}

			head.appendChild(style);
			stylesCreated = true;
		}
	}

	window.addResizeListener = function(element, fn){
		if (attachEvent) element.attachEvent('onresize', fn);
		else {
			if (!element.__resizeTriggers__) {
				if (getComputedStyle(element).position == 'static') element.style.position = 'relative';
				createStyles();
				element.__resizeLast__ = {};
				element.__resizeListeners__ = [];
				(element.__resizeTriggers__ = document.createElement('div')).className = 'resize-triggers';
				element.__resizeTriggers__.innerHTML = '<div class="expand-trigger"><div></div></div>' +
																						'<div class="contract-trigger"></div>';
				element.appendChild(element.__resizeTriggers__);
				resetTriggers(element);
				element.addEventListener('scroll', scrollListener, true);

				/* Listen for a css animation to detect element display/re-attach */
				animationstartevent && element.__resizeTriggers__.addEventListener(animationstartevent, function(e) {
					if(e.animationName == animationName)
						resetTriggers(element);
				});
			}
			element.__resizeListeners__.push(fn);
		}
	};

	window.removeResizeListener = function(element, fn){
		if (attachEvent) element.detachEvent('onresize', fn);
		else {
			element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
			if (!element.__resizeListeners__.length) {
					element.removeEventListener('scroll', scrollListener);
					element.__resizeTriggers__ = !element.removeChild(element.__resizeTriggers__);
			}
		}
	};
})();
