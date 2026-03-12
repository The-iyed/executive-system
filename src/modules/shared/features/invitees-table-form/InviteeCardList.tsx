
import { ColumnConfig, TableRow } from "@/lib/dynamic-table-form";
import InviteeCard from "./InviteeCard";
import { Users } from "lucide-react";

interface InviteeCardListProps {
  invitees: TableRow[];
  columns: ColumnConfig[];
  title?: string;
}

const InviteeCardList = ({ invitees, columns, title = "قائمة المدعوين" }: InviteeCardListProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {invitees?.length} عنصر مضاف
            </p>
          </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {invitees.map((invitee, i) => (
          <InviteeCard key={i} invitee={invitee} columns={columns} />
        ))}
      </div>
    </div>
  );
};

export default InviteeCardList;