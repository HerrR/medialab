package se.kth.csc.facerecog;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.util.Date;
import java.util.Properties;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;

import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;
import javax.ws.rs.core.UriInfo;

@Path("recognize")
public class Recognize {

	@Context
	UriInfo uriInfo;

	static final File queueFolder = new File("queue");

	static final File incomingFolder = new File("incoming");

	static final File outgoingFolder = new File("outgoing");

	static final File counterFile = new File("counter.properties");

	static final ConcurrentLinkedQueue<File> incomingQueue = new ConcurrentLinkedQueue<File>();

	static long ticketCount = 0, processedCount = 0;

	static String counterSince;

	static boolean hasReadCounter = false;

	static IncomingWatcher incomingWatcher;

	@POST
	public Response post(InputStream is) {
		UUID job = UUID.randomUUID();

		if (!queueFolder.exists())
			queueFolder.mkdir();

		File queueFile = new File(queueFolder, job + ".jpg");
		try {
			Files.copy(is, queueFile.toPath());
		} catch (IOException e) {
			e.printStackTrace();
			return Response.serverError().build();
		}
		synchronized (incomingQueue) {
			incomingQueue.add(queueFile);
			if (incomingWatcher == null) {
				incomingQueue.poll();
				if (!incomingFolder.exists())
					incomingFolder.mkdir();
				incomingWatcher = new IncomingWatcher();
				new Thread(incomingWatcher).start();
				queueFile
						.renameTo(new File(incomingFolder, queueFile.getName()));
				System.out.println("Job placed directly in incoming: "
						+ queueFile.getName());
			} else {
				System.out.println("Job placed in queue: "
						+ queueFile.getName());
			}
		}

		if (!hasReadCounter)
			readCounter();
		long ticket = ++ticketCount;
		writeCounter();
		System.out.println("Job assigned ticket no.: " + ticket);
		URI uri = uriInfo.getAbsolutePathBuilder().path(job.toString()).build();
		return Response.created(uri).entity("{\"ticket\":" + ticket + "}")
				.type(MediaType.APPLICATION_JSON_TYPE).build();
	}

	@GET
	@Path("{job}")
	public Response get(@PathParam("job") UUID job) {
		File queueFile = new File(queueFolder, job + ".jpg");
		if (queueFile.isFile()) {
			if (!hasReadCounter)
				readCounter();
			return Response.ok(
					"{\"status\":\"queued\",\"processed\":" + processedCount
							+ "}", MediaType.APPLICATION_JSON_TYPE).build();
		}

		final File resultFile = new File(outgoingFolder, job + ".json");
		if (!resultFile.isFile()) {
			File detectionFailFile = new File(incomingFolder, job
					+ ".jpg_detectionFail.txt");
			if (detectionFailFile.isFile()) {
				return Response.ok("{\"status\":\"detectionFail\"}",
						MediaType.APPLICATION_JSON_TYPE).build();
			} else {
				return Response.ok("{\"status\":\"waiting\"}",
						MediaType.APPLICATION_JSON_TYPE).build();
			}
		}

		return Response.ok(new StreamingOutput() {
			public void write(OutputStream os) throws IOException,
					WebApplicationException {
				Files.copy(resultFile.toPath(), os);
			}
		}).build();
	}

	@GET
	public Response status() {
		if (!hasReadCounter)
			readCounter();
		return Response.ok(
				"{\"processed\":" + processedCount + ",\"tickets\":"
						+ ticketCount + ",\"since\":\"" + counterSince
						+ "\",\"time\":\"" + new Date() + "\"}",
				MediaType.APPLICATION_JSON_TYPE).build();
	}

	static class IncomingWatcher implements Runnable {

		public void run() {
			try {
				System.out.println("Starting watch service for incoming");
				WatchService watcher = FileSystems.getDefault()
						.newWatchService();
				if (!incomingFolder.exists())
					incomingFolder.mkdir();
				incomingFolder.toPath().register(watcher,
						StandardWatchEventKinds.ENTRY_DELETE);
				for (;;) {
					WatchKey key = watcher.take();
					for (WatchEvent<?> event : key.pollEvents()) {
						WatchEvent.Kind<?> kind = event.kind();
						System.out.println("Watch service event: " + kind);
						if (kind == StandardWatchEventKinds.OVERFLOW) {
							continue;
						}
						if (kind == StandardWatchEventKinds.ENTRY_DELETE) {
							System.out.println("Incoming file deleted");
							@SuppressWarnings("unchecked")
							WatchEvent<java.nio.file.Path> ev = (WatchEvent<java.nio.file.Path>) event;
							java.nio.file.Path filePath = ev.context();
							File doneFile = filePath.toFile();
							if (doneFile.getName().endsWith(".jpg")) {
								System.out
										.println("Is a .jpg file - waiting for result JSON or detectionFail.txt");
								File resultFile = new File(outgoingFolder,
										doneFile.getName().substring(0, 36)
												+ ".json");
								File detectionFailFile = new File(
										incomingFolder, doneFile.getName()
												+ "_detectionFail.txt");
								while (!resultFile.isFile()
										&& !detectionFailFile.isFile())
									Thread.sleep(100);
								Thread.sleep(100);
								if (!hasReadCounter)
									readCounter();
								processedCount++;
								System.out.println("Job no. " + processedCount
										+ " done: " + doneFile.getName());
								File queueFile = incomingQueue.poll();
								if (queueFile != null) {
									System.out
											.println("Moving file from queue to incoming: "
													+ queueFile.getName());
									queueFile.renameTo(new File(incomingFolder,
											queueFile.getName()));
								} else {
									System.out
											.println("Queue is empty! Stopping watch service for incoming");
									synchronized (incomingQueue) {
										if (incomingQueue.size() == 0) {
											incomingWatcher = null;
											watcher.close();
											return;
										}
									}
								}
							} else {
								System.out
										.println("Is not a .jpg file - ignored");
							}
						}
					}
					boolean valid = key.reset();
					if (!valid) {
						break;
					}
				}
			} catch (IOException e) {
				e.printStackTrace();
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}

	synchronized static void readCounter() {
		Properties properties = new Properties();
		if (counterFile.isFile()) {
			try {
				InputStream is = new FileInputStream(counterFile);
				properties.load(is);
				is.close();
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		ticketCount = processedCount = Long.valueOf(properties.getProperty(
				"count", "0"));
		counterSince = properties.getProperty("since", new Date().toString());
		hasReadCounter = true;
	}

	synchronized static void writeCounter() {
		Properties properties = new Properties();
		properties.setProperty("count", String.valueOf(ticketCount));
		properties.setProperty("since", counterSince);
		try {
			properties.store(new FileWriter(counterFile), null);
		} catch (IOException e) {
			e.printStackTrace();
		}
	}

}
