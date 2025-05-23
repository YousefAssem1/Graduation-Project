console.clear();
gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  console.log("Page loaded, initializing GSAP timeline...");

  gsap.timeline({
    scrollTrigger: {
      trigger: ".wrapper",
      start: "top top",
      end: "+=150%",
      pin: true,
      scrub: true,
      markers: false 
    }
  })
  .to(".image-container img", { // Target only the image inside .image-container
    scale: 2,
    z: 350,
    transformOrigin: "center center",
    ease: "power1.inOut"
  })
  .to(
    ".section.hero",
    {
      scale: 1.1,
      transformOrigin: "center center",
      ease: "power1.inOut"
    },
    "<"
  );
});