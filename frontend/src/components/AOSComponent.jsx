import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const AOSComponent = ({ children }) => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      easing: 'ease-in-out',
      offset: 100,
      delay: 0,
      anchorPlacement: 'top-bottom',
      disable: false,
      startEvent: 'DOMContentLoaded',
      initClassName: 'aos-init',
      animatedClassName: 'aos-animate',
      useClassNames: false,
      disableMutationObserver: false,
      debounceDelay: 50,
      throttleDelay: 99,
    });

    // Refresh AOS when component updates
    AOS.refresh();

    return () => {
      AOS.refresh();
    };
  }, []);

  return <>{children}</>;
};

export default AOSComponent;