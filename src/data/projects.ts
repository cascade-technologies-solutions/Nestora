export interface Project {
  id: number;
  title: string;
  category: 'Construction' | 'Renovation' | 'Waterproofing' | 'Fabrication' | 'Earthworks';
  location: string;
  status: 'Completed' | 'In Progress' | 'Planning';
  description: string;
  image: string;
}

export const allProjects: Project[] = [
  {
    id: 1,
    title: "Commercial Plaza Structure",
    category: "Construction",
    location: "Vidyanagar, Hubli",
    status: "Completed",
    description: "End-to-end structural works and civil construction of a multi-storey retail and office complex.",
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "Vikas Nagar Residential Makeover",
    category: "Renovation",
    location: "Keshwapur, Hubli",
    status: "Completed",
    description: "Complete interior remodelling, structural reinforcement, and modernization of a two-storey private residence.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "Industrial Roof Waterproofing",
    category: "Waterproofing",
    location: "Gokul Road, Hubli",
    status: "Completed",
    description: "Multi-layered membrane application and crack injection sealing for a large manufacturing warehouse terrace.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 4,
    title: "Custom Structural Steel Framing",
    category: "Fabrication",
    location: "Navanagar, Hubli",
    status: "Completed",
    description: "Precision heavy-metal fabrication and installation of support trusses and staircases for a commercial site.",
    image: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 5,
    title: "Site Leveling & Foundation Excavation",
    category: "Earthworks",
    location: "Unkal, Hubli",
    status: "In Progress",
    description: "Bulk excavation, earthmoving, soil compaction, and site clearance for a major housing layout planning.",
    image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 6,
    title: "Apartment Terrace Seepage Control",
    category: "Waterproofing",
    location: "Vidyanagar, Hubli",
    status: "In Progress",
    description: "Seepage rectification, polyurethane coating, and drain line optimization for a residential society.",
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
  }
];
