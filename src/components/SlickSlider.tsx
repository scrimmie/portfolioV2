import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export const SlickSlider = ({
  images,
  alt = "Project screenshot",
}: {
  images: string[];
  alt?: string;
}) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };
  return (
    <div className="block w-full h-full">
      <Slider {...settings}>
        {images.map((image, index) => (
          <img src={image} key={image} alt={`${alt} ${index + 1}`} />
        ))}
      </Slider>
    </div>
  );
};
