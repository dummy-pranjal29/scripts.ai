import { getAllPlaygroundForUser } from "@/modules/dashboard/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Clock,
  Code2,
  Zap,
  Lightbulb,
  Database,
  Compass,
  FlameIcon,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Define proper types
type Templates = "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";

interface Playground {
  id: string;
  title: string;
  description?: string;
  template: Templates;
  updatedAt: string;
  starMarks?: {
    isMarked: boolean;
  }[];
}

// Map template types to icons
const templateIconMap: Record<string, LucideIcon> = {
  REACT: Code2,
  NEXTJS: Code2,
  EXPRESS: Code2,
  VUE: Code2,
  HONO: Code2,
  ANGULAR: Code2,
  ZAP: Zap,
  LIGHTBULB: Lightbulb,
  DATABASE: Database,
  COMPASS: Compass,
  FLAME: FlameIcon,
  TERMINAL: Terminal,
};

const Page = async () => {
  const playgrounds = await getAllPlaygroundForUser();

  const getTemplateIcon = (template: string) => {
    return templateIconMap[template] || Code2;
  };

  const getTemplateColor = (template: string) => {
    const colors: Record<string, string> = {
      REACT: "bg-blue-100 text-blue-800",
      NEXTJS: "bg-gray-100 text-gray-800",
      EXPRESS: "bg-green-100 text-green-800",
      VUE: "bg-emerald-100 text-emerald-800",
      HONO: "bg-orange-100 text-orange-800",
      ANGULAR: "bg-red-100 text-red-800",
    };
    return colors[template] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          All Playgrounds
        </h1>
        <p className="text-gray-600">
          Manage and access all your playground projects
        </p>
      </div>

      {playgrounds && playgrounds.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Code2 className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No playgrounds yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first playground to get started
          </p>
          <Button asChild>
            <Link href="/dashboard">Create Playground</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playgrounds?.map((playground: Playground) => {
            const IconComponent = getTemplateIcon(playground.template);
            const isStarred =
              playground.starMarks &&
              playground.starMarks.length > 0 &&
              playground.starMarks[0]?.isMarked;

            return (
              <Card
                key={playground.id}
                className="hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent className="w-5 h-5 text-gray-700" />
                      </div>
                      <Badge className={getTemplateColor(playground.template)}>
                        {playground.template}
                      </Badge>
                    </div>
                    {isStarred && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">
                    {playground.title}
                  </CardTitle>
                  {playground.description && (
                    <CardDescription className="text-sm mt-1">
                      {playground.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Updated{" "}
                      {new Date(playground.updatedAt).toLocaleDateString()}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/playground/${playground.id}`}>Open</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Page;
