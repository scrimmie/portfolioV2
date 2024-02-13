import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export const SlickSlider = ({ images }: { images: string[] }) => {
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
        {images.map((image, index) => {
          return <img src={image} key={index} />;
        })}
      </Slider>
    </div>
  );
};
