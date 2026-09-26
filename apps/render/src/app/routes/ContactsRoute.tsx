import { Link } from "react-router-dom";
import { Import } from "lucide-react";
import { ContactsPage } from "features/contacts/components/ContactsPage";

export function ContactsRoute(): React.ReactElement {
  return (
    <ContactsPage
      emptyAction={
        <Link
          to="/import"
          className="inline-flex items-center gap-3 rounded-xl bg-primaryColor px-4 py-2.5 text-sm text-white"
        >
          <Import size={16} /> Import contacts
        </Link>
      }
    />
  );
}
export default ContactsRoute;
