import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const localities = [
  {
    id: 1,
    name: "Vidyanagar",
    price: "Starting at ₹1.2M",
    properties: 24,
    image: "https://images.unsplash.com/photo-1518481852452-9415dscf0e3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
  },
  {
    id: 2,
    name: "Keshwapur",
    price: "Starting at ₹850K",
    properties: 16,
    image: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  },
  {
    id: 3,
    name: "Deshpande Nagar",
    price: "Starting at ₹950K",
    properties: 21,
    image: "https://images.unsplash.com/photo-1573059756025-0038d4ffcbe2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=735&q=80",
  },
  {
    id: 4,
    name: "Navanagar",
    price: "Starting at ₹1.5M",
    properties: 12,
    image: "https://images.unsplash.com/photo-1574259392081-dbd30e96bda7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=765&q=80",
  },
  {
    id: 5,
    name: "Unkal",
    price: "Starting at ₹1.1M",
    properties: 9,
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 6,
    name: "Gokul Road",
    price: "Starting at ₹2.2M",
    properties: 7,
    image: "https://images.unsplash.com/photo-1483401757487-2ced3fa77952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1173&q=80",
  },
  {
    id: 7,
    name: "Ashok Nagar",
    price: "Starting at ₹1.3M",
    properties: 15,
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 8,
    name: "Gopankoppa",
    price: "Starting at ₹780K",
    properties: 11,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 9,
    name: "Sattur",
    price: "Starting at ₹920K",
    properties: 19,
    image: "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 10,
    name: "Kusugal",
    price: "Starting at ₹750K",
    properties: 13,
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 11,
    name: "Rayapur",
    price: "Starting at ₹1.05M",
    properties: 10,
    image: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
  {
    id: 12,
    name: "Tarihal",
    price: "Starting at ₹980K",
    properties: 18,
    image: "https://images.unsplash.com/photo-1530695440407-21fef47230b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  },
];

const AllLocalities = () => {
  const handleViewLocality = (localityName: string) => {
    alert(`Viewing details for ₹{localityName}. This would navigate to a locality details page in a production environment.`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center">
          <Link to="/">
            <Button variant="ghost" className="hover:bg-gray-50">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold">All Localities in Hubli</h1>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {localities.map((locality) => (
            <LocalityCard 
              key={locality.id} 
              locality={locality} 
              onView={() => handleViewLocality(locality.name)}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

interface LocalityCardProps {
  locality: typeof localities[0];
  onView: () => void;
}

const LocalityCard = ({ locality, onView }: LocalityCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-xl h-80 transition-all duration-300 hover:shadow-lg">
      {/* Background Image */}
      <div className="absolute inset-0 img-hover-zoom">
        <img 
          src={locality.image} 
          alt={locality.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xl font-bold mb-1">{locality.name}</h3>
            <p className="text-sm opacity-80">{locality.price}</p>
            <p className="text-xs opacity-70">{locality.properties} properties</p>
          </div>
          <Button 
            className="bg-white hover:bg-gray-100 text-Nestora-dark rounded-full w-10 h-10 p-0 flex items-center justify-center"
            onClick={onView}
            aria-label={`View ₹{locality.name}`}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AllLocalities;
