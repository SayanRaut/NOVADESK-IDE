import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ExampleProjects from "../components/ExampleProjects";
import HowItWorks from "../components/HowItWorks";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

function Home() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white selection:bg-violet-500/30 selection:text-violet-200 font-sans">
            <Navbar />

            <main>
                <Hero />
                <ExampleProjects />
                <HowItWorks />
                <CTA />
            </main>

            <Footer />
        </div>
    );
}
export default Home;