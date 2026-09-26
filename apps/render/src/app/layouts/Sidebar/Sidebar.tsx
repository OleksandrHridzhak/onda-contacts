import { Sun, Moon, UserPlus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useThemeStore } from "features/settings/stores/useThemeStore";
import { sideBarItems } from "./constants";

const deriveActive = (path: string): string =>
  sideBarItems.find((item) => item.path !== "/" && path.startsWith(item.path))
    ?.name ?? "contacts";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const themeMode = useThemeStore((state) => state.themeMode);
  const toggleTheme = useThemeStore((state) => state.toggleThemeMode);

  const active = deriveActive(location.pathname);

  const handleKeyActivate =
    (action: () => void) => (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        action();
      }
    };

  // Keep the current selection on the contacts page while the form is open.
  const openNewContact = () => {
    const params = new URLSearchParams(
      location.pathname === "/" ? location.search : "",
    );
    params.set("new", "1");
    navigate(`/?${params.toString()}`);
  };

  return (
    <div
      className={`
  fixed bottom-0 w-full h-auto bg-background border-t border-border 
  flex flex-row items-center justify-center p-2 z-50
  md:relative md:w-20 md:h-screen md:flex-col md:items-center 
  md:justify-between md:p-4 md:border-r md:border-t-0
`}
    >
      <div>
        <div className="hidden md:flex flex-col items-center mt-6 leading-none">
          <p className="font-poppins font-medium text-md text-primaryColor">
            ONDA
          </p>
          <p className="font-poppins text-[9px] uppercase tracking-widest text-textMuted mt-1">
            contacts
          </p>
        </div>
        <ul
          className={`
            flex flex-row gap-6 justify-around items-center w-full mt-0
            md:flex-col md:gap-10 md:justify-center md:items-center md:mt-36 md:w-auto
          `}
        >
          {sideBarItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.name;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={item.label}
                aria-label={item.label}
              >
                <li
                  className={`transition-all duration-300 ease-in-out transform p-2 rounded-xl ${
                    isActive
                      ? "bg-primaryColor scale-110 hover:scale-120 shadow-md text-linkActiveText"
                      : "hover:scale-105 hover:bg-backgrundHover"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors duration-300 ${
                      isActive
                        ? "text-sidebarIconActive"
                        : "text-sidebarIconInactive"
                    } `}
                    strokeWidth={1.5}
                  />
                </li>
              </Link>
            );
          })}

          <li
            role="button"
            tabIndex={0}
            className="transition-all duration-300 ease-in-out transform p-2.5 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 bg-primaryColor text-white hover:scale-105 shadow-md"
            onClick={openNewContact}
            onKeyDown={handleKeyActivate(openNewContact)}
            aria-label="Add contact"
            title="Add contact"
          >
            <UserPlus
              className="w-6 h-6 md:w-7 text-white md:h-7"
              strokeWidth={1.5}
            />
          </li>

          <li
            role="button"
            tabIndex={0}
            className="p-2 rounded-xl transition-all duration-300 cursor-pointer"
            onClick={toggleTheme}
            onKeyDown={handleKeyActivate(toggleTheme)}
            aria-label="Toggle theme"
          >
            {themeMode === "dark" ? (
              <Moon
                className="w-6 h-6 text-primaryColor transition-all duration-300 transform rotate-0 hover:rotate-[360deg]"
                strokeWidth={1.5}
              />
            ) : (
              <Sun
                className="w-6 h-6 text-primaryColor transition-all duration-300 transform rotate-0 hover:rotate-180"
                strokeWidth={1.5}
              />
            )}
          </li>
        </ul>
      </div>
    </div>
  );
};

export { Sidebar };
export default Sidebar;
