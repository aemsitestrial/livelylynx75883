import { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

function Slide({ image, title, description, isActive }) {
    return (
        <div className={`slider-slide ${isActive ? 'is-active' : ''}`} aria-hidden={!isActive}>
            {image && <img src={image} alt={title || ''} />}
            <div className="slider-slide-content">
                {title && <h2>{title}</h2>}
                {description && <p>{description}</p>}
            </div>
        </div>
    );
}

export default function Slider({ slides, autoplay = true, interval = 6000 }) {
    const [index, setIndex] = useState(0);
    const timerRef = useRef(null);

    const goTo = (i) => {
        const next = (i + slides.length) % slides.length;
        setIndex(next);
    };

    useEffect(() => {
        if (!autoplay || slides.length <= 1) return undefined;
        timerRef.current = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length);
        }, interval);
        return () => clearInterval(timerRef.current);
    }, [autoplay, interval, slides.length]);

    if (!slides.length) return null;

    return (
        <div className="slider-inner">
            <div
                className="slider-track"
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {slides.map((slide, i) => (
                    <Slide key={i} {...slide} isActive={i === index} />
                ))}
            </div>

            {slides.length > 1 && (
                <>
                    {/* <button
                        type="button"
                        className="slider-arrow slider-arrow-prev"
                        aria-label="Previous slide"
                        onClick={() => goTo(index - 1)}
                    >
                        &#8249;
                    </button>
                    <button
                        type="button"
                        className="slider-arrow slider-arrow-next"
                        aria-label="Next slide"
                        onClick={() => goTo(index + 1)}
                    >
                        &#8250;
                    </button> */}

                    <div className="slider-dots">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                className={i === index ? 'is-active' : ''}
                                aria-label={`Go to slide ${i + 1}`}
                                onClick={() => goTo(i)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export function mountSlider(container, slides) {
    const root = createRoot(container);
    root.render(<Slider slides={slides} />);
}