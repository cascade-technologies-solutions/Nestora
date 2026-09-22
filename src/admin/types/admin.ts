// ─── Operating Console Types ──────────────────────────────────────────────────

export type PropertyStatus = 'draft' | 'published' | 'under_negotiation' | 'sold' | 'rented' | 'archived';
export type PropertyType = 'For Sale' | 'For Rent';
export type PropertyCategory = 'Residential' | 'Commercial' | 'Plots & Land';

export interface AdminProperty {
  id: string;
  propertyCode: string; // e.g. NST-101
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  type: PropertyType;
  category: PropertyCategory;
  isNew: boolean;
  image: string;
  status: PropertyStatus;
  featured: boolean;
  assignedAdmin?: string; // Employee ID or Name
  createdAt: string;
  updatedAt: string;
  // Extra fields for tab structure
  amenities?: string[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

export interface EmployeeRole {
  role: 'Super Admin' | 'Admin';
}

export type EmployeeRoleType = 'Super Admin' | 'Admin';
export type EmployeeStatus = 'Active' | 'Suspended' | 'Deactivated';

export interface Employee {
  id: string;
  name: string;
  username: string;
  role: EmployeeRoleType;
  status: EmployeeStatus;
  passwordHash: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminProject {
  id: string;
  title: string;
  category: 'Construction' | 'Renovation' | 'Waterproofing' | 'Fabrication' | 'Earthworks';
  location: string;
  status: 'Completed' | 'In Progress' | 'Planning' | 'Archived';
  description: string;
  image: string;
  beforeImage?: string;
  afterImage?: string;
  gallery: string[];
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminService {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // CSS bg class
  enabled: boolean;
  order: number;
  image?: string;
  workTypes: string[];
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string; // Base64 data URL or external URL
  size: number;
  createdAt: string;
}

export interface CTAButton {
  label: string;
  href: string;
  variant: 'primary' | 'secondary' | 'whatsapp';
}

export interface HomepageCMS {
  heroHeading: string;
  heroDescription: string;
  heroImages: string[];
  ctaButtons: CTAButton[];
  aboutHeading: string;
  aboutText1: string;
  aboutText2: string;
  aboutImage: string;
  updatedAt: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
}

export interface SiteSettings {
  companyName: string;
  logoUrl: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  whatsappCommunityUrl: string;
  socialLinks: SocialLinks;
  footerTagline: string;
  updatedAt: string;
}

export interface AdminSession {
  username: string;
  name: string;
  role: EmployeeRoleType;
  loginTime: number;
}

export interface ActivityLog {
  id: string;
  user: string; // Username / Name
  action: string; // Natural language sentence, e.g. "published Property NST-104"
  module: 'Properties' | 'Projects' | 'Services' | 'Employees' | 'Website CMS' | 'Enquiries' | 'Media Library';
  timestamp: string;
}

export type EnquiryStatus = 'New' | 'Contacted' | 'Site Visit' | 'Negotiation' | 'Closed';
export type EnquiryPriority = 'Low' | 'Medium' | 'High';

export interface Enquiry {
  id: string;
  type: 'contact' | 'property' | 'service';
  name: string;
  email: string;
  phone: string;
  message: string;
  propertyId?: string; // If property enquiry
  serviceId?: string;  // If service enquiry
  status: EnquiryStatus;
  priority: EnquiryPriority;
  assignedTo?: string; // Employee ID
  internalNotes: string;
  followUpDate?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}
