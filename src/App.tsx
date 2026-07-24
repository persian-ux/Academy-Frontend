import { Provider } from "react-redux";
import { store } from "@/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  increment,
  decrement,
  reset,
  incrementByAmount,
} from "@/store/slices/counterSlice";
import { useState } from "react";

function CounterDemo() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState(5);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Redux Counter
          <Badge variant="secondary">Redux Toolkit</Badge>
        </CardTitle>
        <CardDescription>
          A simple counter demonstrating Redux state management with shadcn/ui
          components.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center">
          <span className="text-6xl font-bold tabular-nums">{count}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => dispatch(decrement())}
          >
            Decrement
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => dispatch(increment())}
          >
            Increment
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="amount" className="text-nowrap">
            Add amount:
          </Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-20"
          />
          <Button
            variant="secondary"
            onClick={() => dispatch(incrementByAmount(amount))}
          >
            Add
          </Button>
          <Button variant="ghost" onClick={() => dispatch(reset())}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ComponentShowcase() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>shadcn/ui Components</CardTitle>
        <CardDescription>
          All components are ready to use in your project.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button>Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Badge>Badge</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Label htmlFor="demo-input">Input:</Label>
          <Input id="demo-input" placeholder="Type something..." className="max-w-xs" />
        </div>

        <Separator />

        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="cherry">Cherry</SelectItem>
          </SelectContent>
        </Select>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Loading skeleton:</p>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>

        <Separator />

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="destructive">Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Edit <code>src/App.tsx</code> to get started
      </CardFooter>
    </Card>
  );
}

function App() {
  return (
    <Provider store={store}>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold">Academy Frontend</h1>
            <Badge variant="outline" className="text-xs">
              React + Vite + TypeScript
            </Badge>
          </div>
        </header>
        <main className="container mx-auto flex flex-col items-center gap-8 px-4 py-8">
          <CounterDemo />
          <ComponentShowcase />
        </main>
      </div>
    </Provider>
  );
}

export default App;

