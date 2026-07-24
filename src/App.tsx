import { Provider } from "react-redux";
import { store } from "@/store";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Achievements from "@/components/Achievements";
import TeachersCarousel from "@/components/TeachersCarousel";
import Footer from "@/components/Footer";

function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Navbar />
        <Hero />
        <About />
        <Achievements />
        <TeachersCarousel />
        <Footer />
      </div>
    </Provider>
  );
}

export default App;

