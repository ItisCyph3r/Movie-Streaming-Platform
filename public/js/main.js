(function ($) {

	"use strict";

	var fullHeight = function () {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function () {
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	var carousel = function () {
		$('.featured-carousel').owlCarousel({
			loop: true,
			autoplay: true,
			margin: 30,
			animateOut: 'fadeOut',
			animateIn: 'fadeIn',
			nav: true,
			dots: true,
			autoplayHoverPause: false,
			items: 1,
			navText: ["<span class='ion-ios-arrow-back'></span>", "<span class='ion-ios-arrow-forward'></span>"],
			responsive: {
				0: {
					items: 1
				},
				600: {
					items: 2
				},
				1000: {
					items: 3
				}
			}
		});

	};
	carousel();

})(jQuery);

// JS CODEJavaScript
const codes = document.querySelectorAll('.code')
 
codes[0].focus()
 
codes.forEach((code, idx) => {
    code.addEventListener('keydown', (e) => {
        if(e.key >= 0 && e.key <=9) {
            codes[idx].value = ''
            setTimeout(() => codes[idx + 1].focus(), 10)
        } else if(e.key === 'Backspace') {
            setTimeout(() => codes[idx - 1].focus(), 10)
        }
    })
})
console.log('working')

const search = document.querySelector(".search-box input"),
images = document.querySelectorAll(".imageBox"),
carousell = document.querySelector('.showwcase'),
notFound = document.querySelector('.notFound');


search.addEventListener("keypress", e => {
    carousell.classList.add("block")
	let searcValue = search.value,
		value = searcValue.toLowerCase();
	images.forEach(image => {
		// if (value === image.dataset.name) { //matching value with getting attribute of images
		if (image.dataset.name.includes(value.split())) { 
			return image.style.display = "block";
		}
		else{
			notFound.classList.add('resultFound');
			image.style.display = "none";
		}
		notFound.classList.remove('resultFound');
	});

});

search.addEventListener("keyup", () => {
    if (search.value != "") return;

    images.forEach(image => {
        image.style.display = "block";
    })
})