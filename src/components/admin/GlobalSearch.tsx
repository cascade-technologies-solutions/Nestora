import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyRepository } from '@/admin/repositories/propertyRepository';
import { projectRepository } from '@/admin/repositories/projectRepository';
import { servicesRepository } from '@/admin/repositories/servicesRepository';
import { enquiryRepository } from '@/admin/repositories/enquiryRepository';
import { employeeRepository } from '@/admin/repositories/employeeRepository';
import type { AdminProperty, AdminProject, AdminService, Enquiry, Employee } from '@/admin/types/admin';
import { Search, Building, Folder, Wrench, MessageSquare, ArrowRight, X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [results, setResults] = useState<{
    properties: AdminProperty[];
    projects: AdminProject[];
    services: AdminService[];
    enquiries: Enquiry[];
    employees: Employee[];
  }>({ properties: [], projects: [], services: [], enquiries: [], employees: [] });

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search execution
  useEffect(() => {
    const executeSearch = async () => {
      const q = query.toLowerCase().trim();
      if (!q) {
        setResults({ properties: [], projects: [], services: [], enquiries: [], employees: [] });
        setFocusedIndex(-1);
        return;
      }

      const [allProps, allProjects, allServices, allEnq, allEmployees] = await Promise.all([
        propertyRepository.getAll(),
        projectRepository.getAll(),
        servicesRepository.getAll(),
        enquiryRepository.getAll(),
        employeeRepository.getAll()
      ]);

      const filteredProps = allProps.filter(
        p => p.title.toLowerCase().includes(q) ||
             p.address.toLowerCase().includes(q) ||
             p.propertyCode.toLowerCase().includes(q)
      );

      const filteredProjects = allProjects.filter(
        p => p.title.toLowerCase().includes(q) ||
             p.location.toLowerCase().includes(q) ||
             p.category.toLowerCase().includes(q)
      );

      const filteredServices = allServices.filter(
        s => s.title.toLowerCase().includes(q) ||
             s.description.toLowerCase().includes(q)
      );

      const filteredEnq = allEnq.filter(
        e => e.name.toLowerCase().includes(q) ||
             e.email.toLowerCase().includes(q) ||
             e.message.toLowerCase().includes(q)
      );

      const filteredEmployees = allEmployees.filter(
        emp => emp.name.toLowerCase().includes(q) ||
               emp.username.toLowerCase().includes(q) ||
               emp.role.toLowerCase().includes(q)
      );

      setResults({
        properties: filteredProps.slice(0, 3),
        projects: filteredProjects.slice(0, 3),
        services: filteredServices.slice(0, 3),
        enquiries: filteredEnq.slice(0, 3),
        employees: filteredEmployees.slice(0, 3)
      });
      setFocusedIndex(-1);
    };

    const timer = setTimeout(executeSearch, 150);
    return () => clearTimeout(timer);
  }, [query]);

  // Flattened results for keyboard navigation index mapping
  const flatResults: Array<{ id: string; path: string }> = [
    ...results.properties.map(p => ({ id: `prop-${p.id}`, path: `/admin/properties/edit/${p.id}` })),
    ...results.projects.map(p => ({ id: `proj-${p.id}`, path: `/admin/projects/edit/${p.id}` })),
    ...results.services.map(s => ({ id: `serv-${s.id}`, path: `/admin/services` })),
    ...results.enquiries.map(e => ({ id: `enq-${e.id}`, path: `/admin/enquiries` })),
    ...results.employees.map(emp => ({ id: `emp-${emp.id}`, path: `/admin/employees` }))
  ];

  const handleNavigate = (path: string) => {
    setQuery('');
    setIsOpen(false);
    setFocusedIndex(-1);
    navigate(path);
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < flatResults.length) {
        handleNavigate(flatResults[focusedIndex].path);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const hasResults = 
    results.properties.length > 0 ||
    results.projects.length > 0 ||
    results.services.length > 0 ||
    results.enquiries.length > 0 ||
    results.employees.length > 0;

  // Running absolute index tracker for layout mapping
  let runningIndex = 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md" onKeyDown={handleKeyDown}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Global Search (Properties, Projects, Enquiries...)"
          className={cn(
            "w-full pl-9 pr-8 py-2 text-sm bg-slate-800/80 hover:bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500 border border-slate-700/60 transition-all h-9"
          )}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setFocusedIndex(-1);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
          {!hasResults ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No matches found for <span className="text-slate-300 font-medium">"{query}"</span>
            </div>
          ) : (
            <div className="p-2 space-y-3">
              {/* Properties */}
              {results.properties.map((p, idx) => {
                const absoluteIndex = runningIndex++;
                const isFocused = focusedIndex === absoluteIndex;
                return (
                  <div key={p.id} className={idx === 0 ? "pt-1" : ""}>
                    {idx === 0 && (
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                        <Building className="w-3 h-3 text-slate-500" /> Properties
                      </div>
                    )}
                    <button
                      onClick={() => handleNavigate(`/admin/properties/edit/${p.id}`)}
                      onMouseEnter={() => setFocusedIndex(absoluteIndex)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group",
                        isFocused ? "bg-slate-800 text-white" : "hover:bg-slate-800/40 text-slate-300"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-medium truncate max-w-[280px]", isFocused ? "text-white" : "text-slate-200")}>
                          {p.title}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.propertyCode} · {p.address}</p>
                      </div>
                      <ArrowRight className={cn("w-3.5 h-3.5 transition-all", isFocused ? "text-blue-400 translate-x-0.5" : "text-slate-700")} />
                    </button>
                  </div>
                );
              })}

              {/* Projects */}
              {results.projects.map((p, idx) => {
                const absoluteIndex = runningIndex++;
                const isFocused = focusedIndex === absoluteIndex;
                return (
                  <div key={p.id} className={idx === 0 ? "pt-1" : ""}>
                    {idx === 0 && (
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                        <Folder className="w-3 h-3 text-slate-500" /> Projects
                      </div>
                    )}
                    <button
                      onClick={() => handleNavigate(`/admin/projects/edit/${p.id}`)}
                      onMouseEnter={() => setFocusedIndex(absoluteIndex)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group",
                        isFocused ? "bg-slate-800 text-white" : "hover:bg-slate-800/40 text-slate-300"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-medium truncate max-w-[280px]", isFocused ? "text-white" : "text-slate-200")}>
                          {p.title}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.category} · {p.location}</p>
                      </div>
                      <ArrowRight className={cn("w-3.5 h-3.5 transition-all", isFocused ? "text-blue-400 translate-x-0.5" : "text-slate-700")} />
                    </button>
                  </div>
                );
              })}

              {/* Services */}
              {results.services.map((s, idx) => {
                const absoluteIndex = runningIndex++;
                const isFocused = focusedIndex === absoluteIndex;
                return (
                  <div key={s.id} className={idx === 0 ? "pt-1" : ""}>
                    {idx === 0 && (
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                        <Wrench className="w-3 h-3 text-slate-500" /> Services
                      </div>
                    )}
                    <button
                      onClick={() => handleNavigate(`/admin/services`)}
                      onMouseEnter={() => setFocusedIndex(absoluteIndex)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group",
                        isFocused ? "bg-slate-800 text-white" : "hover:bg-slate-800/40 text-slate-300"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-medium truncate max-w-[280px]", isFocused ? "text-white" : "text-slate-200")}>
                          {s.title}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[285px] mt-0.5">{s.description}</p>
                      </div>
                      <ArrowRight className={cn("w-3.5 h-3.5 transition-all", isFocused ? "text-blue-400 translate-x-0.5" : "text-slate-700")} />
                    </button>
                  </div>
                );
              })}

              {/* Enquiries */}
              {results.enquiries.map((e, idx) => {
                const absoluteIndex = runningIndex++;
                const isFocused = focusedIndex === absoluteIndex;
                return (
                  <div key={e.id} className={idx === 0 ? "pt-1" : ""}>
                    {idx === 0 && (
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                        <MessageSquare className="w-3 h-3 text-slate-500" /> Enquiries
                      </div>
                    )}
                    <button
                      onClick={() => handleNavigate(`/admin/enquiries`)}
                      onMouseEnter={() => setFocusedIndex(absoluteIndex)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group",
                        isFocused ? "bg-slate-800 text-white" : "hover:bg-slate-800/40 text-slate-300"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-medium truncate max-w-[280px]", isFocused ? "text-white" : "text-slate-200")}>
                          Enquiry from {e.name}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[285px] mt-0.5">{e.message}</p>
                      </div>
                      <ArrowRight className={cn("w-3.5 h-3.5 transition-all", isFocused ? "text-blue-400 translate-x-0.5" : "text-slate-700")} />
                    </button>
                  </div>
                );
              })}

              {/* Employees */}
              {results.employees.map((emp, idx) => {
                const absoluteIndex = runningIndex++;
                const isFocused = focusedIndex === absoluteIndex;
                return (
                  <div key={emp.id} className={idx === 0 ? "pt-1" : ""}>
                    {idx === 0 && (
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-1">
                        <Users className="w-3 h-3 text-slate-500" /> Employees
                      </div>
                    )}
                    <button
                      onClick={() => handleNavigate(`/admin/employees`)}
                      onMouseEnter={() => setFocusedIndex(absoluteIndex)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between group",
                        isFocused ? "bg-slate-800 text-white" : "hover:bg-slate-800/40 text-slate-300"
                      )}
                    >
                      <div>
                        <p className={cn("text-sm font-medium truncate max-w-[280px]", isFocused ? "text-white" : "text-slate-200")}>
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">@{emp.username} · {emp.role}</p>
                      </div>
                      <ArrowRight className={cn("w-3.5 h-3.5 transition-all", isFocused ? "text-blue-400 translate-x-0.5" : "text-slate-700")} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
