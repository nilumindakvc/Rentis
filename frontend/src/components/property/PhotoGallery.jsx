import Carousel from 'react-bootstrap/Carousel'

const PLACEHOLDER = 'https://placehold.co/800x500?text=Rentit'

export default function PhotoGallery({ photos = [] }) {
  const items = photos.length > 0 ? photos : [{ id: 'placeholder', url: PLACEHOLDER }]

  return (
    <Carousel interval={null} className="rounded-3 overflow-hidden border bg-light">
      {items.map((photo) => (
        <Carousel.Item key={photo.id}>
          <img
            src={photo.url}
            alt=""
            style={{ width: '100%', height: 420, objectFit: 'cover' }}
          />
        </Carousel.Item>
      ))}
    </Carousel>
  )
}
